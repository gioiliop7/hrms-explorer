// components/KhmdhsPanel.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Gavel,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  fetchKhmdhsAction,
  fetchKhmdhsActsAction,
  refreshKhmdhsAction,
  type KhmdhsPeriod,
} from "@/lib/actions";
import { downloadCsv, timestampedFilename } from "@/lib/csv";
import { actCsvColumns } from "@/lib/khmdhs/export";
import {
  ACT_TYPE_META,
  type KhmdhsActType,
  type KhmdhsOrganizationData,
} from "@/lib/khmdhs/types";
import { formatDate } from "@/lib/utils";

const PRESETS: { months: number; label: string }[] = [
  { months: 6, label: "6 μήνες" },
  { months: 12, label: "12 μήνες" },
  { months: 24, label: "24 μήνες" },
];

const DEFAULT_MONTHS = 12;

/** The period the panel is showing: a rolling window, or an explicit range. */
type Period =
  | { kind: "months"; months: number }
  | { kind: "range"; dateFrom: string; dateTo: string };

function toActionPeriod(period: Period): KhmdhsPeriod {
  return period.kind === "months"
    ? { months: period.months }
    : { dateFrom: period.dateFrom, dateTo: period.dateTo };
}

/**
 * How many ΚΗΜΔΗΣ requests a period costs, for warning about the longer ones.
 * Five act types, each split into 180-day windows.
 */
function requestCount(period: Period): number {
  const days =
    period.kind === "months"
      ? period.months * 30.44
      : (new Date(period.dateTo).getTime() - new Date(period.dateFrom).getTime()) /
        86_400_000;
  return 5 * Math.max(1, Math.ceil(days / 180));
}

/** Whole euros — cents are noise at the scale these figures are read at. */
function euros(value: number): string {
  return value.toLocaleString("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

type Tab = "recent" | "cpv" | "contractors";

interface KhmdhsPanelProps {
  organizationName: string;
}

export default function KhmdhsPanel({ organizationName }: KhmdhsPanelProps) {
  const [data, setData] = useState<KhmdhsOrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("recent");
  const [exporting, setExporting] = useState<KhmdhsActType | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>({
    kind: "months",
    months: DEFAULT_MONTHS,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setData(null);

    fetchKhmdhsAction(organizationName, toActionPeriod(period))
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => {
        console.error("ΚΗΜΔΗΣ fetch failed:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // The organization or period can change while a request is still in flight;
    // without this a slow response would overwrite the newer selection's data.
    return () => {
      cancelled = true;
    };
  }, [organizationName, period]);

  /**
   * Forces a re-query, discarding what the server has cached for this organization.
   *
   * Distinct from changing the period, which already produces fresh data because
   * the dates form part of the cache key. This is for wanting today's answer to a
   * question already asked.
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    setExportError(null);
    try {
      const result = await refreshKhmdhsAction(
        organizationName,
        toActionPeriod(period),
      );
      setData(result);
    } catch (error) {
      console.error("ΚΗΜΔΗΣ refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async (actType: KhmdhsActType) => {
    setExporting(actType);
    setExportError(null);
    try {
      const result = await fetchKhmdhsActsAction(
        organizationName,
        actType,
        toActionPeriod(period),
      );

      // An export walks many more pages than the card does, so it is the request
      // most likely to be throttled. Failing silently would look like a dead button.
      if (!result) {
        setExportError(
          `Η εξαγωγή για «${ACT_TYPE_META[actType].shortLabel}» απέτυχε — πιθανή υπέρβαση ορίου αιτημάτων του ΚΗΜΔΗΣ. Δοκιμάστε ξανά σε λίγο.`,
        );
        return;
      }
      if (result.acts.length === 0) {
        setExportError(
          `Δεν βρέθηκαν πράξεις «${ACT_TYPE_META[actType].shortLabel}» για την περίοδο.`,
        );
        return;
      }

      downloadCsv(
        timestampedFilename(`khmdhs-${actType}`),
        result.acts,
        actCsvColumns,
      );
    } catch (error) {
      console.error("ΚΗΜΔΗΣ export failed:", error);
      setExportError("Η εξαγωγή απέτυχε. Δοκιμάστε ξανά.");
    } finally {
      setExporting(null);
    }
  };

  // The filter row stays mounted across every state, so the period can be changed
  // while a slow query is still running or after one has failed.
  const filters = (
    <PeriodFilter
      period={period}
      onChange={setPeriod}
      onRefresh={handleRefresh}
      busy={loading || refreshing}
    />
  );

  if (loading) return <LoadingState filters={filters} period={period} />;
  if (!data) return <NoMatchState filters={filters} />;
  if (data.fetchFailed) {
    return <FetchFailedState data={data} filters={filters} onRetry={handleRefresh} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <Header data={data} />

      <div className="p-4 sm:p-6 space-y-6">
        {filters}

        {refreshing && (
          <p className="flex items-center gap-2 text-xs text-indigo-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Ανανέωση από το ΚΗΜΔΗΣ...
          </p>
        )}

        <SummaryGrid
          data={data}
          onExport={handleExport}
          exporting={exporting}
        />

        {exportError && (
          <p className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-px" />
            {exportError}
          </p>
        )}

        {data.truncated && <TruncationNotice />}

        <div>
          <TabBar tab={tab} onChange={setTab} data={data} />
          <div className="pt-4">
            {tab === "recent" && <RecentActs data={data} />}
            {tab === "cpv" && <TopCpvs data={data} />}
            {tab === "contractors" && <TopContractors data={data} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One filter row scoping everything below it: the period, plus a refresh that
 * bypasses the server's cache.
 */
function PeriodFilter({
  period,
  onChange,
  onRefresh,
  busy,
}: {
  period: Period;
  onChange: (period: Period) => void;
  onRefresh: () => void;
  busy: boolean;
}) {
  const [custom, setCustom] = useState(period.kind === "range");
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(
    period.kind === "range" ? period.dateFrom : "",
  );
  const [to, setTo] = useState(period.kind === "range" ? period.dateTo : today);

  const rangeValid = Boolean(from && to && from <= to);

  return (
    <div className="flex flex-wrap items-center gap-2 pb-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
        Περίοδος
      </span>

      {PRESETS.map((preset) => {
        const active =
          period.kind === "months" && period.months === preset.months;
        return (
          <button
            key={preset.months}
            onClick={() => {
              setCustom(false);
              onChange({ kind: "months", months: preset.months });
            }}
            disabled={busy}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              active
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {preset.label}
          </button>
        );
      })}

      <button
        onClick={() => setCustom((c) => !c)}
        disabled={busy}
        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          period.kind === "range"
            ? "bg-indigo-600 border-indigo-600 text-white"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        Επιλογή ημερομηνιών
      </button>

      <button
        onClick={onRefresh}
        disabled={busy}
        title="Αγνοεί την προσωρινή αποθήκευση και ρωτά ξανά το ΚΗΜΔΗΣ"
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
        Ανανέωση
      </button>

      {custom && (
        <div className="w-full flex flex-wrap items-end gap-2 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <label className="text-xs text-gray-600">
            Από
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="block mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </label>
          <label className="text-xs text-gray-600">
            Έως
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="block mt-1 px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </label>
          <button
            onClick={() => onChange({ kind: "range", dateFrom: from, dateTo: to })}
            disabled={busy || !rangeValid}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Εφαρμογή
          </button>
          {from && to && !rangeValid && (
            <span className="text-xs text-red-600">
              Η αρχική ημερομηνία πρέπει να προηγείται της τελικής.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ data }: { data: KhmdhsOrganizationData }) {
  return (
    <div className="bg-indigo-50 border-b border-indigo-200 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
          <ShoppingCart className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">
            Δημόσιες Συμβάσεις (ΚΗΜΔΗΣ)
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {formatDate(data.dateFrom)} – {formatDate(data.dateTo)}
          </p>

          {/* The registry is matched by name, so which entity was matched is part of
              the result, not a technical detail to hide. */}
          <p className="text-xs text-gray-500 mt-2">
            Αντιστοιχίστηκε με:{" "}
            <span className="font-medium text-gray-700">
              {data.organization.name}
            </span>{" "}
            <span className="text-gray-400">
              (κωδ. {data.organization.key})
            </span>
          </p>

          {data.matchConfidence === "partial" && (
            <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded-md px-2 py-1">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
              <span>
                Η αντιστοίχιση έγινε με βάση το όνομα και δεν είναι ακριβής —
                ελέγξτε ότι πρόκειται για τον ίδιο φορέα.
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const ACT_TYPE_ACCENT: Record<KhmdhsActType, string> = {
  request: "border-slate-200",
  notice: "border-blue-200",
  auction: "border-violet-200",
  contract: "border-emerald-200",
  payment: "border-amber-200",
};

function SummaryGrid({
  data,
  onExport,
  exporting,
}: {
  data: KhmdhsOrganizationData;
  onExport: (actType: KhmdhsActType) => void;
  exporting: KhmdhsActType | null;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {data.summaries.map((summary) => (
        <div
          key={summary.actType}
          className={`bg-white border-2 ${ACT_TYPE_ACCENT[summary.actType]} rounded-lg p-3 flex flex-col`}
        >
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {ACT_TYPE_META[summary.actType].shortLabel}
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {summary.count.toLocaleString("el-GR")}
          </p>

          {summary.sampledCount > 0 && (
            <p className="text-xs text-gray-600 mt-1 leading-snug">
              {euros(summary.sampledCostWithoutVAT)}
              <span className="block text-[10px] text-gray-400">
                {summary.complete
                  ? "σύνολο, χωρίς ΦΠΑ"
                  : `από ${summary.sampledCount} πιο πρόσφατες`}
              </span>
            </p>
          )}

          <button
            onClick={() => onExport(summary.actType)}
            disabled={summary.count === 0 || exporting !== null}
            className="mt-auto pt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            {exporting === summary.actType ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Εξαγωγή...
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                CSV
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

function TruncationNotice() {
  return (
    <p className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
      <AlertTriangle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-px" />
      <span>
        Τα πλήθη είναι ακριβή. Τα ποσά, τα CPV και οι ανάδοχοι υπολογίζονται από
        δείγμα των πιο πρόσφατων πράξεων — για το πλήρες σύνολο κατεβάστε το CSV.
      </span>
    </p>
  );
}

function TabBar({
  tab,
  onChange,
  data,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
  data: KhmdhsOrganizationData;
}) {
  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] =
    [
      {
        id: "recent",
        label: "Πρόσφατες πράξεις",
        icon: Gavel,
        count: data.recentActs.length,
      },
      { id: "cpv", label: "Είδη δαπανών (CPV)", icon: Package, count: data.topCpvs.length },
      {
        id: "contractors",
        label: "Ανάδοχοι",
        icon: Users,
        count: data.topContractors.length,
      },
    ];

  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {tabs.map(({ id, label, icon: Icon, count }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          disabled={count === 0}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors disabled:text-gray-300 disabled:cursor-not-allowed ${
            tab === id
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
          {count > 0 && (
            <span className="text-xs text-gray-400">({count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

function RecentActs({ data }: { data: KhmdhsOrganizationData }) {
  if (data.recentActs.length === 0) return <Empty />;

  return (
    <div className="space-y-2">
      {data.recentActs.map((act) => (
        <a
          key={`${act.actType}-${act.referenceNumber}`}
          href={act.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start justify-between gap-3 bg-white border border-gray-200 rounded-md p-3 hover:shadow-md hover:border-indigo-300 transition-all"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {ACT_TYPE_META[act.actType].shortLabel}
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                {act.referenceNumber}
              </span>
              {act.cancelled && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  Ακυρωμένη
                </span>
              )}
            </div>

            <p
              className="text-sm text-gray-800 group-hover:text-indigo-700 line-clamp-2"
              title={act.title}
            >
              {act.title}
            </p>

            <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 flex-wrap">
              {act.signedDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(act.signedDate)}
                </span>
              )}
              {act.contractors[0] && (
                <span className="truncate max-w-[16rem]">
                  {act.contractors[0].name}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {act.totalCostWithoutVAT !== null && (
              <span className="text-sm font-semibold text-gray-900">
                {euros(act.totalCostWithoutVAT)}
              </span>
            )}
            <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
          </div>
        </a>
      ))}
    </div>
  );
}

/**
 * Bars are scaled against the largest value in the list, not against total spend:
 * the question this answers is which categories dominate relative to each other.
 */
function TopCpvs({ data }: { data: KhmdhsOrganizationData }) {
  if (data.topCpvs.length === 0) return <Empty />;
  const max = Math.max(...data.topCpvs.map((c) => c.totalCost), 1);

  return (
    <div className="space-y-2">
      {data.topCpvs.map((cpv) => (
        <div key={cpv.code} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-gray-800 truncate" title={cpv.label}>
              {cpv.label || cpv.code}
            </span>
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              {euros(cpv.totalCost)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${(cpv.totalCost / max) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-gray-400 w-24 text-right">
              {cpv.code}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopContractors({ data }: { data: KhmdhsOrganizationData }) {
  if (data.topContractors.length === 0) return <Empty />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <th className="py-2 pr-3 font-semibold">Ανάδοχος</th>
            <th className="py-2 px-3 font-semibold">ΑΦΜ</th>
            <th className="py-2 px-3 font-semibold text-right">Πράξεις</th>
            <th className="py-2 pl-3 font-semibold text-right">Αξία</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.topContractors.map((contractor) => (
            <tr
              key={contractor.vatNumber ?? contractor.name}
              className="hover:bg-gray-50"
            >
              <td className="py-2 pr-3 text-gray-800">{contractor.name}</td>
              <td className="py-2 px-3 font-mono text-xs text-gray-500">
                {contractor.vatNumber ?? "—"}
              </td>
              <td className="py-2 px-3 text-right text-gray-600">
                {contractor.count}
              </td>
              <td className="py-2 pl-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                {euros(contractor.totalCost)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-gray-500 text-center py-8">
      Δεν βρέθηκαν στοιχεία για την περίοδο.
    </p>
  );
}

function LoadingState({
  filters,
  period,
}: {
  filters: React.ReactNode;
  period: Period;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 space-y-5">
      {filters}

      <div className="flex items-center gap-3 text-indigo-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">
          Φόρτωση δημοσίων συμβάσεων από το ΚΗΜΔΗΣ...
        </span>
      </div>

      {/* Measured at about a minute for a ministry the first time, then a few
          hundred milliseconds once cached. Saying so up front is the difference
          between a slow page and an apparently broken one. */}
      <p className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-px" />
        <span>
          Το ΚΗΜΔΗΣ απαντά αργά την πρώτη φορά — η αναζήτηση{" "}
          {requestCount(period)} κατηγοριών πράξεων μπορεί να χρειαστεί έως ένα
          λεπτό. Οι επόμενες προβολές του ίδιου φορέα είναι άμεσες.
        </span>
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/**
 * Shown when the organization *is* in the ΚΗΜΔΗΣ register but every lookup failed.
 *
 * Deliberately not the same screen as NoMatchState: ΚΗΜΔΗΣ rate-limits sustained
 * use for a long window afterwards, and telling someone an authority files no
 * public contracts when the truth is "we were throttled" is the more damaging of
 * the two possible wrong answers.
 */
function FetchFailedState({
  data,
  filters,
  onRetry,
}: {
  data: KhmdhsOrganizationData;
  filters: React.ReactNode;
  onRetry: () => void;
}) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
      <div className="[&_button]:bg-white/70">{filters}</div>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            Το ΚΗΜΔΗΣ δεν απάντησε
          </p>
          <p className="text-xs text-amber-800 mt-1 max-w-xl">
            Ο φορέας <span className="font-medium">{data.organization.name}</span>{" "}
            υπάρχει στο μητρώο, αλλά καμία από τις κατηγορίες πράξεων δεν
            επιστράφηκε. Συνήθως πρόκειται για προσωρινή υπέρβαση του ορίου
            αιτημάτων του ΚΗΜΔΗΣ.
          </p>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-amber-300 text-amber-900 rounded-md hover:bg-amber-100 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Δοκιμή ξανά
          </button>
        </div>
      </div>
    </div>
  );
}

function NoMatchState({ filters }: { filters: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
      <div className="text-left mb-4">{filters}</div>
      <FileSpreadsheet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">
        Ο φορέας δεν εντοπίστηκε στο ΚΗΜΔΗΣ
      </p>
      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
        Το ΚΗΜΔΗΣ δεν προσφέρει αναζήτηση φορέων, οπότε η αντιστοίχιση γίνεται
        με βάση την επωνυμία. Ο φορέας είτε δεν έχει δημοσιεύσει πράξεις είτε
        τις δημοσιεύει με διαφορετική ονομασία.
      </p>
    </div>
  );
}
