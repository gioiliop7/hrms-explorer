// components/ComparisonView.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Download, Loader2, Plus, X } from "lucide-react";
import { organizationAPI, orgUnitsAPI, positionsAPI } from "@/lib/api";
import {
  fetchKhmdhsAction,
  fetchKhmdhsActsAction,
  fetchOrganizationExtraStatsAction,
  type OrganizationExtraStats,
} from "@/lib/actions";
import { downloadCsv, timestampedFilename, type CsvColumn } from "@/lib/csv";
import { actCsvColumns } from "@/lib/khmdhs/export";
import {
  getEducationLabel,
  MAIN_EDUCATION_CATEGORIES,
  getEmployeeCategoryDescription,
  getEmploymentTypeDescription,
  getPositionStatusLabel,
  getRankDescription,
  getUnitTypeLabel,
} from "@/lib/utils";
import type {
  FMitrooForeasDto,
  OrgmaMonadaDto,
  OrgmaThesiDto,
} from "@/types/api";
import type {
  KhmdhsActType,
  KhmdhsOrganizationData,
} from "@/lib/khmdhs/types";

/**
 * Categorical slots 1–3 of the validated palette.
 *
 * Three, not more: these charts are small multiples, where every pair of series can
 * appear together, and only the first three slots clear the colour-vision-deficiency
 * floors under that condition. A fourth would put yellow beside orange.
 */
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];
const MAX_ORGANIZATIONS = SERIES_COLORS.length;

const INK_MUTED = "#898781";
const GRIDLINE = "#e1e0d9";

const PERIOD_MONTHS = 12;

/**
 * Financial years to count Διαύγεια decisions for.
 *
 * Διαύγεια only filters by financial year — arbitrary date ranges are rejected — so
 * these figures sit on a different time basis from the ΚΗΜΔΗΣ ones beside them and
 * the year is shown in every label. The current year is partial by definition.
 */
const DECISION_YEARS = (() => {
  const current = new Date().getUTCFullYear();
  return [current, current - 1, current - 2];
})();

/**
 * An organization plus the palette slot it was given.
 *
 * The slot is assigned once, on add, and never recomputed from position in the
 * list. Colouring by index would repaint the survivors when one is removed, and a
 * reader who has learned "this one is blue" would be misled.
 */
interface Slotted {
  organization: FMitrooForeasDto;
  slot: number;
}

interface OrgStats {
  code: string;
  units: number | null;
  positions: number | null;
  positionsOccupied: number | null;
  positionsEmpty: number | null;
  /** Positions per education category (ΠΕ/ΤΕ/ΔΕ/ΥΕ), keyed by the category code. */
  positionsByEducation: Record<number, number> | null;
  khmdhs: KhmdhsOrganizationData | null;
  extras: OrganizationExtraStats | null;
  // The rows themselves are kept, not just their counts, so the per-organization
  // export can write them out without fetching everything a second time.
  unitRows: OrgmaMonadaDto[] | null;
  positionRows: OrgmaThesiDto[] | null;
  /** Sources still in flight, of the four fetched per organization. */
  pending: number;
}


interface ComparisonViewProps {
  initialOrganization?: FMitrooForeasDto;
  onClose: () => void;
}

function shortName(name: string, max = 30): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function counts(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : value.toLocaleString("el-GR");
}

function euros(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : value.toLocaleString("el-GR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      });
}

/**
 * ΚΗΜΔΗΣ figures for one act type, or undefined when there are none to show.
 *
 * A failed lookup yields undefined rather than the zeroed summaries it produced,
 * so the table prints "—" instead of a confident "0" — in a side-by-side
 * comparison a false zero reads as a real finding about that authority.
 */
function actSummary(stats: OrgStats | undefined, actType: KhmdhsActType) {
  if (!stats?.khmdhs || stats.khmdhs.fetchFailed) return undefined;
  return stats.khmdhs.summaries.find((s) => s.actType === actType);
}

function contractSummary(stats: OrgStats | undefined) {
  return actSummary(stats, "contract");
}

export default function ComparisonView({
  initialOrganization,
  onClose,
}: ComparisonViewProps) {
  const [selected, setSelected] = useState<Slotted[]>(
    initialOrganization ? [{ organization: initialOrganization, slot: 0 }] : [],
  );
  const [stats, setStats] = useState<Record<string, OrgStats>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FMitrooForeasDto[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [exporting, setExporting] = useState<{
    code: string;
    kind: ExportKind;
  } | null>(null);

  // Stats are cached per organization code, so adding a third does not refetch the
  // first two — each of these loads pulls a full positions list and five ΚΗΜΔΗΣ
  // queries, which is far too much work to repeat on every list change.
  const loadedRef = useRef(new Set<string>());

  const loadStats = useCallback(async (org: FMitrooForeasDto) => {
    if (loadedRef.current.has(org.code)) return;
    loadedRef.current.add(org.code);

    const patch = (changes: Partial<OrgStats>) =>
      setStats((prev) => ({
        ...prev,
        [org.code]: { ...prev[org.code], ...changes } as OrgStats,
      }));

    patch({
      code: org.code,
      units: null,
      positions: null,
      positionsOccupied: null,
      positionsEmpty: null,
      positionsByEducation: null,
      khmdhs: null,
      extras: null,
      unitRows: null,
      positionRows: null,
      pending: 4,
    });

    // Each source writes its own slice as it lands rather than the three being
    // awaited together: a ΚΗΜΔΗΣ lookup can take a minute on a cold upstream
    // cache, and waiting for it would leave the unit and position counts — both
    // of which return in under a second — showing as missing the whole time.
    const done = () =>
      setStats((prev) => {
        const current = prev[org.code];
        if (!current) return prev;
        return {
          ...prev,
          [org.code]: { ...current, pending: Math.max(0, current.pending - 1) },
        };
      });

    orgUnitsAPI
      .getUnits(org.code)
      .then((res) => {
        const units = res.data.data || [];
        patch({ units: units.length, unitRows: units });
      })
      .catch((error) => console.error("units failed:", error))
      .finally(done);

    positionsAPI
      .getPositions(org.code)
      .then((res) => {
        const positions = res.data.data || [];
        const byEducation: Record<number, number> = {};
        for (const position of positions) {
          const category = position.educationCategory;
          if (category) byEducation[category] = (byEducation[category] ?? 0) + 1;
        }
        patch({
          positions: positions.length,
          positionsOccupied: positions.filter((p) => p.status === "Occupied")
            .length,
          positionsEmpty: positions.filter((p) => p.status === "Empty").length,
          positionsByEducation: byEducation,
          positionRows: positions,
        });
      })
      .catch((error) => console.error("positions failed:", error))
      .finally(done);

    fetchKhmdhsAction(org.preferredLabel, { months: PERIOD_MONTHS })
      .then((khmdhs) => patch({ khmdhs }))
      .catch((error) => console.error("ΚΗΜΔΗΣ failed:", error))
      .finally(done);

    fetchOrganizationExtraStatsAction(
      org.preferredLabel,
      org.code,
      DECISION_YEARS,
    )
      .then((extras) => patch({ extras }))
      .catch((error) => console.error("extra stats failed:", error))
      .finally(done);
  }, []);

  useEffect(() => {
    selected.forEach((entry) => loadStats(entry.organization));
  }, [selected, loadStats]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await organizationAPI.search({ preferredLabel: query });
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const addOrganization = (org: FMitrooForeasDto) => {
    setNotice(null);

    if (selected.some((entry) => entry.organization.code === org.code)) {
      setNotice("Ο φορέας υπάρχει ήδη στη σύγκριση.");
      return;
    }
    if (selected.length >= MAX_ORGANIZATIONS) {
      setNotice(`Μπορείτε να συγκρίνετε έως ${MAX_ORGANIZATIONS} φορείς.`);
      return;
    }

    const taken = new Set(selected.map((entry) => entry.slot));
    const slot = SERIES_COLORS.findIndex((_, index) => !taken.has(index));

    setSelected((prev) => [...prev, { organization: org, slot }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeOrganization = (code: string) => {
    setSelected((prev) => prev.filter((e) => e.organization.code !== code));
    setNotice(null);
  };

  const anyLoading = selected.some(
    (entry) => (stats[entry.organization.code]?.pending ?? 3) > 0,
  );

  /**
   * True when any organization's contract figures come from a sample rather than
   * the full period — which makes the money comparison indicative, not exact.
   */
  const contractValueIsSampled = selected.some((entry) => {
    const summary = contractSummary(stats[entry.organization.code]);
    return summary ? !summary.complete : false;
  });

  /**
   * Writes one organization's own records to their own file.
   *
   * Units and positions are already in memory from the comparison load; ΚΗΜΔΗΣ acts
   * are fetched here because the comparison only ever pulled counts, and an export
   * is a deliberate click that can afford the wait.
   */
  const handleOrgExport = async (
    org: FMitrooForeasDto,
    kind: ExportKind,
  ) => {
    setExporting({ code: org.code, kind });
    setNotice(null);
    const slug = fileSlug(org.preferredLabel, org.code);
    const orgStats = stats[org.code];

    try {
      if (kind === "units") {
        const rows = orgStats?.unitRows ?? [];
        if (rows.length === 0) return;
        downloadCsv(timestampedFilename(`monades-${slug}`), rows, unitCsvColumns);
        return;
      }

      if (kind === "positions") {
        const rows = orgStats?.positionRows ?? [];
        if (rows.length === 0) return;
        downloadCsv(
          timestampedFilename(`theseis-${slug}`),
          rows,
          positionCsvColumns,
        );
        return;
      }

      const result = await fetchKhmdhsActsAction(
        org.preferredLabel,
        "contract",
        { months: PERIOD_MONTHS },
      );
      if (!result || result.acts.length === 0) {
        setNotice(
          `Δεν ήταν δυνατή η εξαγωγή συμβάσεων για «${org.preferredLabel}».`,
        );
        return;
      }
      downloadCsv(
        timestampedFilename(`symvaseis-${slug}`),
        result.acts,
        actCsvColumns,
      );
    } catch (error) {
      console.error("per-organization export failed:", error);
      setNotice("Η εξαγωγή απέτυχε. Δοκιμάστε ξανά.");
    } finally {
      setExporting(null);
    }
  };

  const handleExport = () => {
    const rows = selected.map((entry) => {
      const s = stats[entry.organization.code];
      const contracts = contractSummary(s);
      return {
        organization: entry.organization,
        stats: s,
        contracts,
      };
    });

    const columns: CsvColumn<(typeof rows)[number]>[] = [
      { header: "Κωδικός φορέα", value: (r) => r.organization.code },
      { header: "Φορέας", value: (r) => r.organization.preferredLabel },
      { header: "Οργανωτικές μονάδες", value: (r) => r.stats?.units },
      { header: "Θέσεις εργασίας", value: (r) => r.stats?.positions },
      { header: "Καλυμμένες θέσεις", value: (r) => r.stats?.positionsOccupied },
      { header: "Κενές θέσεις", value: (r) => r.stats?.positionsEmpty },
      ...MAIN_EDUCATION_CATEGORIES.map((category) => ({
        header: `Θέσεις ${getEducationLabel(category)}`,
        value: (r: (typeof rows)[number]) =>
          r.stats?.positionsByEducation?.[category] ?? null,
      })),
      {
        header: `Συμβάσεις ΚΗΜΔΗΣ (${PERIOD_MONTHS} μήνες)`,
        value: (r) => r.contracts?.count,
      },
      {
        header: "Αξία συμβάσεων χωρίς ΦΠΑ",
        value: (r) => r.contracts?.sampledCostWithoutVAT,
      },
      {
        header: "Αξία: πλήρης περίοδος;",
        value: (r) => (r.contracts ? r.contracts.complete : null),
      },
      {
        header: "Πράξεις που αθροίστηκαν",
        value: (r) => r.contracts?.sampledCount,
      },
      {
        header: "Προκηρύξεις ΚΗΜΔΗΣ",
        value: (r) => actSummary(r.stats, "notice")?.count,
      },
      {
        header: "Πληρωμές ΚΗΜΔΗΣ",
        value: (r) => actSummary(r.stats, "payment")?.count,
      },
      // The year is in every Διαύγεια header: these count whole financial years,
      // not the rolling ΚΗΜΔΗΣ window in the columns beside them.
      ...DECISION_YEARS.map((year) => ({
        header: `Αποφάσεις Διαύγειας ${year}`,
        value: (r: (typeof rows)[number]) =>
          r.stats?.extras?.diavgeia?.byYear.find((y) => y.year === year)?.count ??
          null,
      })),
      {
        header: "Σύνολο αποφάσεων Διαύγειας",
        value: (r) => r.stats?.extras?.diavgeia?.totalAllTime ?? null,
      },
      {
        header: "Διαδικασίες Μίτου",
        value: (r) => r.stats?.extras?.mitosProcedures ?? null,
      },
      {
        header: "Ανοιχτές διαβουλεύσεις",
        value: (r) =>
          r.stats?.extras?.consultations.siteKnown
            ? r.stats.extras.consultations.count
            : null,
      },
      {
        header: "Στο δίκτυο opengov;",
        value: (r) => r.stats?.extras?.consultations.siteKnown ?? null,
      },
    ];

    downloadCsv(timestampedFilename("sygrisi-foreon"), rows, columns);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Σύγκριση Φορέων</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Οργανωτική δομή, θέσεις εργασίας και δημόσιες συμβάσεις
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <button
                onClick={handleExport}
                disabled={anyLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Κλείσιμο"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {selected.length < MAX_ORGANIZATIONS && (
            <OrganizationPicker
              query={searchQuery}
              results={searchResults}
              onSearch={handleSearch}
              onPick={addOrganization}
            />
          )}

          {notice && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {notice}
            </p>
          )}

          {selected.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              Προσθέστε φορείς για να ξεκινήσετε τη σύγκριση
            </p>
          ) : (
            <>
              <SelectedCards
                selected={selected}
                stats={stats}
                exporting={exporting}
                onRemove={removeOrganization}
                onExport={handleOrgExport}
              />

              <ComparisonTable selected={selected} stats={stats} />

              {selected.length >= 2 && (
                <Charts
                  selected={selected}
                  stats={stats}
                  contractValueIsSampled={contractValueIsSampled}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrganizationPicker({
  query,
  results,
  onSearch,
  onPick,
}: {
  query: string;
  results: FMitrooForeasDto[];
  onSearch: (q: string) => void;
  onPick: (org: FMitrooForeasDto) => void;
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Plus className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">
          Προσθήκη Φορέα για Σύγκριση
        </h3>
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Αναζήτηση φορέα..."
          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {results.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {results.map((org) => (
              <button
                key={org.code}
                onClick={() => onPick(org)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">
                  {org.preferredLabel}
                </div>
                <div className="text-sm text-gray-500">{org.code}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Per-organization detail exports.
 *
 * Separate from the comparison CSV, which is one row per organization of summary
 * figures. These write each body's underlying records in their own natural shape —
 * one row per unit, per position, per act — because that is what can actually be
 * filtered and pivoted; a summary row cannot be drilled into.
 */
const unitCsvColumns: CsvColumn<OrgmaMonadaDto>[] = [
  { header: "Κωδικός μονάδας", value: (u) => u.code },
  { header: "Ονομασία", value: (u) => u.preferredLabel },
  { header: "Τύπος μονάδας", value: (u) => getUnitTypeLabel(u.unitType) },
  { header: "Προϊστάμενη μονάδα", value: (u) => u.supervisorUnitCode },
  { header: "Κωδικός φορέα", value: (u) => u.organizationCode },
  { header: "Περιγραφή", value: (u) => u.description },
  { header: "Email", value: (u) => u.email },
  { header: "Τηλέφωνο", value: (u) => u.telephone },
  { header: "Ιστότοπος", value: (u) => u.url },
  { header: "Διεύθυνση", value: (u) => u.mainAddress?.fullAddress },
];

const positionCsvColumns: CsvColumn<OrgmaThesiDto>[] = [
  { header: "Κωδικός θέσης", value: (p) => p.code },
  { header: "Κωδικός μονάδας", value: (p) => p.unitCode },
  {
    header: "Τύπος",
    value: (p) =>
      p.type === "Organic"
        ? "Οργανική"
        : p.type === "Temporary"
          ? "Προσωποπαγής"
          : "",
  },
  { header: "Κατάσταση", value: (p) => getPositionStatusLabel(p.status) },
  {
    header: "Σχέση εργασίας",
    value: (p) => getEmploymentTypeDescription(p.employmentType),
  },
  {
    header: "Κατηγορία υπαλλήλου",
    value: (p) => getEmployeeCategoryDescription(p.employeeCategory),
  },
  {
    header: "Εκπαιδευτική κατηγορία",
    value: (p) =>
      p.educationCategory ? getEducationLabel(p.educationCategory) : "",
  },
  { header: "Βαθμός", value: (p) => getRankDescription(p.rank) },
  { header: "Περιγράμμα θέσης", value: (p) => p.jobDescriptionTitle },
];

/** Filename-safe slug of an organization name, for per-body export files. */
function fileSlug(name: string, code: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 40);
  return slug ? `${slug}-${code}` : code;
}

type ExportKind = "units" | "positions" | "contracts";

function OrganizationExport({
  stats,
  busyKind,
  onExport,
}: {
  stats: OrgStats | undefined;
  busyKind: ExportKind | null;
  onExport: (kind: ExportKind) => void;
}) {
  const options: { kind: ExportKind; label: string; count: number | null }[] = [
    { kind: "units", label: "Μονάδες", count: stats?.units ?? null },
    { kind: "positions", label: "Θέσεις", count: stats?.positions ?? null },
    {
      kind: "contracts",
      label: "Συμβάσεις",
      count: contractSummary(stats)?.count ?? null,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-gray-500">Εξαγωγή:</span>
      {options.map((option) => (
        <button
          key={option.kind}
          onClick={() => onExport(option.kind)}
          disabled={!option.count || busyKind !== null}
          title={
            option.count
              ? `${option.count} εγγραφές σε CSV`
              : "Δεν υπάρχουν δεδομένα"
          }
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busyKind === option.kind ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          {option.label}
          {option.count ? (
            <span className="text-gray-400">({option.count})</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** Doubles as the chart legend — identity is never carried by colour alone. */
function SelectedCards({
  selected,
  stats,
  exporting,
  onRemove,
  onExport,
}: {
  selected: Slotted[];
  stats: Record<string, OrgStats>;
  exporting: { code: string; kind: ExportKind } | null;
  onRemove: (code: string) => void;
  onExport: (org: FMitrooForeasDto, kind: ExportKind) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {selected.map(({ organization, slot }) => {
        const orgStats = stats[organization.code];
        const loading = (orgStats?.pending ?? 4) > 0;
        return (
          <div
            key={organization.code}
            className="bg-white border-l-4 border border-gray-200 rounded-lg p-3 shadow-sm space-y-2"
            style={{ borderLeftColor: SERIES_COLORS[slot] }}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className="text-sm font-medium text-gray-900 leading-snug"
                title={organization.preferredLabel}
              >
                {organization.preferredLabel}
              </p>
              <button
                onClick={() => onRemove(organization.code)}
                className="p-1 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                aria-label={`Αφαίρεση ${organization.preferredLabel}`}
              >
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-600" />
              </button>
            </div>

            {loading ? (
              <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Φόρτωση δεδομένων...
              </p>
            ) : (
              <OrganizationExport
                stats={orgStats}
                busyKind={
                  exporting?.code === organization.code ? exporting.kind : null
                }
                onExport={(kind) => onExport(organization, kind)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The table is the primary artifact, not a fallback: it carries exact values for
 * every metric, including the ones the charts leave to the axis, and it is what
 * makes the charts' colour choices legal on a light surface.
 */
function ComparisonTable({
  selected,
  stats,
}: {
  selected: Slotted[];
  stats: Record<string, OrgStats>;
}) {
  // Grouped by source rather than listed flat, because the groups do not share a
  // time basis: ΗΡΜΣ figures are a current snapshot, ΚΗΜΔΗΣ covers a rolling
  // window, and Διαύγεια counts whole financial years. Presenting them as one
  // undifferentiated list would invite reading across rows that are not comparable.
  const groups: {
    title: string;
    note?: string;
    rows: { label: string; render: (s: OrgStats | undefined) => string }[];
  }[] = [
    {
      title: "Οργανωτική δομή & θέσεις",
      note: "ΗΡΜΣ — τρέχουσα κατάσταση",
      rows: [
        { label: "Οργανωτικές μονάδες", render: (s) => counts(s?.units) },
        { label: "Θέσεις εργασίας", render: (s) => counts(s?.positions) },
        {
          label: "Καλυμμένες θέσεις",
          render: (s) => counts(s?.positionsOccupied),
        },
        { label: "Κενές θέσεις", render: (s) => counts(s?.positionsEmpty) },
        ...MAIN_EDUCATION_CATEGORIES.map((category) => ({
          label: `Θέσεις ${getEducationLabel(category)}`,
          render: (s: OrgStats | undefined) =>
            s?.positionsByEducation
              ? counts(s.positionsByEducation[category] ?? 0)
              : "—",
        })),
      ],
    },
    {
      title: "Δημόσιες συμβάσεις",
      note: `ΚΗΜΔΗΣ — τελευταίοι ${PERIOD_MONTHS} μήνες`,
      rows: [
        {
          label: "Συμβάσεις",
          render: (s) => counts(contractSummary(s)?.count),
        },
        {
          label: "Αξία συμβάσεων (χωρίς ΦΠΑ)",
          render: (s) => {
            const summary = contractSummary(s);
            if (!summary || summary.sampledCount === 0) return "—";
            return summary.complete
              ? euros(summary.sampledCostWithoutVAT)
              : `${euros(summary.sampledCostWithoutVAT)} *`;
          },
        },
        {
          label: "Προκηρύξεις",
          render: (s) => counts(actSummary(s, "notice")?.count),
        },
        {
          label: "Πληρωμές",
          render: (s) => counts(actSummary(s, "payment")?.count),
        },
      ],
    },
    {
      title: "Αποφάσεις",
      note: "Διαύγεια — ανά οικονομικό έτος",
      rows: [
        ...DECISION_YEARS.map((year, index) => ({
          label: `Αποφάσεις ${year}${index === 0 ? " (τρέχον, μερικό)" : ""}`,
          render: (s: OrgStats | undefined) =>
            counts(s?.extras?.diavgeia?.byYear.find((y) => y.year === year)?.count),
        })),
        {
          label: "Σύνολο αποφάσεων (από το 2010)",
          render: (s) => counts(s?.extras?.diavgeia?.totalAllTime),
        },
      ],
    },
    {
      title: "Διαδικασίες & διαβουλεύσεις",
      rows: [
        {
          label: "Διαδικασίες στον Μίτο",
          render: (s) => counts(s?.extras?.mitosProcedures),
        },
        {
          label: "Ανοιχτές διαβουλεύσεις (opengov.gr)",
          // A body outside the opengov network is not a body running no
          // consultations, so the two cases must not both print "0".
          render: (s) =>
            !s?.extras
              ? "—"
              : s.extras.consultations.siteKnown
                ? counts(s.extras.consultations.count)
                : "εκτός opengov",
        },
      ],
    },
  ];

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-2.5 px-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">
              Μετρική
            </th>
            {selected.map(({ organization, slot }) => (
              <th
                key={organization.code}
                className="text-right py-2.5 px-3 font-semibold text-gray-800 min-w-[9rem]"
              >
                <span className="flex items-center justify-end gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SERIES_COLORS[slot] }}
                  />
                  <span className="truncate" title={organization.preferredLabel}>
                    {shortName(organization.preferredLabel, 24)}
                  </span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.title} className="divide-y divide-gray-100">
            <tr className="bg-gray-50/70 border-t border-gray-200">
              <td
                colSpan={selected.length + 1}
                className="py-1.5 px-3 text-[11px] font-semibold text-gray-700 uppercase tracking-wide"
              >
                {group.title}
                {group.note && (
                  <span className="ml-2 font-normal normal-case text-gray-500">
                    {group.note}
                  </span>
                )}
              </td>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.label} className="hover:bg-gray-50">
                <td className="py-2 px-3 text-gray-600">{row.label}</td>
                {selected.map(({ organization }) => (
                  <td
                    key={organization.code}
                    className="py-2 px-3 text-right font-semibold text-gray-900 tabular-nums"
                  >
                    {row.render(stats[organization.code])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <p className="text-[11px] text-gray-500 px-3 py-2 bg-gray-50 border-t border-gray-200">
        * Άθροισμα από δείγμα των πιο πρόσφατων συμβάσεων, όχι ολόκληρης της
        περιόδου. Τα πλήθη είναι πάντα ακριβή.
      </p>
    </div>
  );
}

/**
 * Small multiples, one metric per chart.
 *
 * Units, positions and euros differ by orders of magnitude, so they cannot share a
 * scale — and putting them on two y-axes of one plot would invent a relationship
 * that is not in the data. Each metric gets its own axis instead.
 */
function Charts({
  selected,
  stats,
  contractValueIsSampled,
}: {
  selected: Slotted[];
  stats: Record<string, OrgStats>;
  contractValueIsSampled: boolean;
}) {
  const metrics = useMemo(
    () => [
      {
        key: "units",
        title: "Οργανωτικές μονάδες",
        format: counts,
        value: (s: OrgStats | undefined) => s?.units ?? 0,
      },
      {
        key: "positions",
        title: "Θέσεις εργασίας",
        format: counts,
        value: (s: OrgStats | undefined) => s?.positions ?? 0,
      },
      {
        key: "contracts",
        title: `Συμβάσεις ΚΗΜΔΗΣ (${PERIOD_MONTHS} μήνες)`,
        format: counts,
        value: (s: OrgStats | undefined) => contractSummary(s)?.count ?? 0,
      },
      {
        key: "contractValue",
        title: "Αξία συμβάσεων (χωρίς ΦΠΑ)",
        format: euros,
        value: (s: OrgStats | undefined) =>
          contractSummary(s)?.sampledCostWithoutVAT ?? 0,
        caption: contractValueIsSampled
          ? "Από δείγμα των πιο πρόσφατων συμβάσεων — ενδεικτικό."
          : undefined,
      },
    ],
    [contractValueIsSampled],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {metrics.map((metric) => {
        const data = selected.map(({ organization, slot }) => ({
          name: shortName(organization.preferredLabel, 26),
          fullName: organization.preferredLabel,
          value: metric.value(stats[organization.code]),
          color: SERIES_COLORS[slot],
        }));

        const hasData = data.some((d) => d.value > 0);

        return (
          <div
            key={metric.key}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <h3 className="text-sm font-semibold text-gray-800">
              {metric.title}
            </h3>
            {metric.caption && (
              <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                <AlertTriangle className="h-3 w-3" />
                {metric.caption}
              </p>
            )}

            {hasData ? (
              // Height grows with the number of bars so the category axis is never
              // squeezed into a nested scroll.
              <ResponsiveContainer width="100%" height={selected.length * 52 + 24}>
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 8, right: 64, bottom: 0, left: 0 }}
                  barCategoryGap="28%"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 11, fill: INK_MUTED }}
                    axisLine={{ stroke: GRIDLINE }}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(11,11,11,0.04)" }}
                    formatter={(value) => [
                      metric.format(typeof value === "number" ? value : null),
                      "",
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ?? ""
                    }
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: `1px solid ${GRIDLINE}`,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {data.map((entry) => (
                      <Cell key={entry.fullName} fill={entry.color} />
                    ))}
                    {/* Direct labels: with three bars they always fit, and they keep
                        every value readable without relying on hover or on hue. */}
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(value: unknown) =>
                        metric.format(typeof value === "number" ? value : null)
                      }
                      style={{ fontSize: 11, fill: "#52514e", fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">
                Δεν υπάρχουν δεδομένα
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
