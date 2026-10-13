// lib/opengov.ts

export interface OpenGovConsultation {
  id: number;
  title: string;
  link: string;
  publishDate: string;
  expiryDate: string | null;
  status: "open" | "closed" | "pending" | "unknown";
  statusLabel: string;
}

const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]/g, "");
};

// opengov.gr's `status` array has been observed carrying either the English
// slug (e.g. "pending") or the Greek taxonomy label (e.g. "Σε επεξεργασία")
// depending on the post — match on either, normalized.
const STATUS_ENTRIES: {
  keys: string[];
  slug: "open" | "closed" | "pending";
  label: string;
}[] = [
  { keys: ["open", "ανοικτη"], slug: "open", label: "Ανοικτή" },
  { keys: ["closed", "ολοκληρωμενη"], slug: "closed", label: "Ολοκληρωμένη" },
  {
    keys: ["pending", "σεεπεξεργασια"],
    slug: "pending",
    label: "Σε επεξεργασία",
  },
];

function resolveStatus(raw: unknown): {
  status: OpenGovConsultation["status"];
  statusLabel: string;
} {
  const value = Array.isArray(raw)
    ? raw[0]
    : typeof raw === "string"
      ? raw
      : "";
  const normalized = normalizeText(value);
  const match = STATUS_ENTRIES.find((e) => e.keys.includes(normalized));
  if (match) return { status: match.slug, statusLabel: match.label };
  return { status: "unknown", statusLabel: value || "Άγνωστη κατάσταση" };
}

// Static site_id registry (opengov.gr has no name-search endpoint, only site_id lookups)
const SITE_ID_MAP: { siteId: number; name: string }[] = [
  { siteId: 51, name: "ΥΠΟΥΡΓΕΙΟ ΠΡΟΣΤΑΣΙΑΣ ΤΟΥ ΠΟΛΙΤΗ" },
  { siteId: 43, name: "ΥΠΟΥΡΓΕΙΟ ΠΟΛΙΤΙΣΜΟΥ" },
  { siteId: 39, name: "ΥΠΟΥΡΓΕΙΟ ΜΕΤΑΝΑΣΤΕΥΣΗΣ ΚΑΙ ΑΣΥΛΟΥ" },
  { siteId: 52, name: "ΥΠΟΥΡΓΕΙΟ ΚΟΙΝΩΝΙΚΗΣ ΣΥΝΟΧΗΣ ΚΑΙ ΟΙΚΟΓΕΝΕΙΑΣ" },
  { siteId: 30, name: "ΥΠΟΥΡΓΕΙΟ ΑΓΡΟΤΙΚΗΣ ΑΝΑΠΤΥΞΗΣ ΚΑΙ ΤΡΟΦΙΜΩΝ" },
  { siteId: 40, name: "ΥΠΟΥΡΓΕΙΟ ΝΑΥΤΙΛΙΑΣ ΚΑΙ ΝΗΣΙΩΤΙΚΗΣ ΠΟΛΙΤΙΚΗΣ" },
  { siteId: 45, name: "ΥΠΟΥΡΓΕΙΟ ΤΟΥΡΙΣΜΟΥ" },
  { siteId: 48, name: "ΥΠΟΥΡΓΕΙΟ ΨΗΦΙΑΚΗΣ ΔΙΑΚΥΒΕΡΝΗΣΗΣ" },
  { siteId: 37, name: "ΥΠΟΥΡΓΕΙΟ ΚΛΙΜΑΤΙΚΗΣ ΚΡΙΣΗΣ ΚΑΙ ΠΟΛΙΤΙΚΗΣ ΠΡΟΣΤΑΣΙΑΣ" },
  { siteId: 72, name: "Αντιπρόεδρος της Κυβέρνησης και Υπουργός Επικρατείας" },
  { siteId: 73, name: "Υπουργός Επικρατείας" },
  {
    siteId: 97,
    name: "Υφυπουργός στον Πρωθυπουργό και Κυβερνητικός Εκπρόσωπος",
  },
  { siteId: 96, name: "Υφυπουργός στον Πρωθυπουργό" },
  {
    siteId: 62,
    name: "Γενική Γραμματεία Νομικών και Κοινοβουλευτικών Θεμάτων",
  },
  { siteId: 86, name: "Γενική Γραμματεία Επικοινωνίας και Ενημέρωσης" },
  { siteId: 61, name: "ΠΕΡΙΦΕΡΕΙΑ ΚΡΗΤΗΣ" },
  { siteId: 74, name: "ΠΕΡΙΦΕΡΕΙΑ ΑΝΑΤΟΛΙΚΗΣ ΜΑΚΕΔΟΝΙΑΣ ΚΑΙ ΘΡΑΚΗΣ" },
  { siteId: 75, name: "ΠΕΡΙΦΕΡΕΙΑ ΑΤΤΙΚΗΣ" },
  { siteId: 76, name: "ΠΕΡΙΦΕΡΕΙΑ ΒΟΡΕΙΟΥ ΑΙΓΑΙΟΥ" },
  { siteId: 77, name: "ΠΕΡΙΦΕΡΕΙΑ ΔΥΤΙΚΗΣ ΕΛΛΑΔΑΣ" },
  { siteId: 78, name: "ΠΕΡΙΦΕΡΕΙΑ ΔΥΤΙΚΗΣ ΜΑΚΕΔΟΝΙΑΣ" },
  { siteId: 79, name: "ΠΕΡΙΦΕΡΕΙΑ ΗΠΕΙΡΟΥ" },
  { siteId: 80, name: "ΠΕΡΙΦΕΡΕΙΑ ΘΕΣΣΑΛΙΑΣ" },
  { siteId: 81, name: "ΠΕΡΙΦΕΡΕΙΑ ΙΟΝΙΩΝ ΝΗΣΩΝ" },
  { siteId: 82, name: "ΠΕΡΙΦΕΡΕΙΑ ΚΕΝΤΡΙΚΗΣ ΜΑΚΕΔΟΝΙΑΣ" },
  { siteId: 83, name: "ΠΕΡΙΦΕΡΕΙΑ ΝΟΤΙΟΥ ΑΙΓΑΙΟΥ" },
  { siteId: 84, name: "ΠΕΡΙΦΕΡΕΙΑ ΠΕΛΟΠΟΝΝΗΣΟΥ" },
  { siteId: 85, name: "ΠΕΡΙΦΕΡΕΙΑ ΣΤΕΡΕΑΣ ΕΛΛΑΔΑΣ" },
  { siteId: 87, name: "ΑΝΕΞΑΡΤΗΤΗ ΑΡΧΗ ΔΗΜΟΣΙΩΝ ΕΣΟΔΩΝ" },
  { siteId: 88, name: "ΕΝΙΑΙΑ ΑΡΧΗ ΔΗΜΟΣΙΩΝ ΣΥΜΒΑΣΕΩΝ (ΕΑΔΗΣΥ)" },
  {
    siteId: 89,
    name: "ΕΛΛΗΝΙΚΗ ΡΑΔΙΟΦΩΝΙΑ ΤΗΛΕΟΡΑΣΗ ΑΝΩΝΥΜΗ ΕΤΑΙΡΕΙΑ (Ε.Ρ.Τ. Α.Ε.)",
  },
  { siteId: 90, name: "Open Government Partnership" },
  { siteId: 91, name: "ΕΠΙΤΡΟΠΗ ΠΛΗΡΟΦΟΡΙΚΗΣ ΚΑΙ ΕΠΙΚΟΙΝΩΝΙΩΝ" },
  { siteId: 92, name: "ΕΠΙΤΡΟΠΗ ΕΠΟΠΤΕΙΑΣ ΚΑΙ ΕΛΕΓΧΟΥ ΠΑΙΓΝΙΩΝ" },
  { siteId: 93, name: "ΕΠΙΤΡΟΠΗ ΠΡΟΜΗΘΕΙΩΝ ΚΑΙ ΥΓΕΙΑΣ" },
  { siteId: 94, name: "Πρώην Διοικητικής Ανασυγκρότησης" },
  { siteId: 95, name: "Πρώην Υπουργείο Μακεδονίας Θράκης" },
  { siteId: 28, name: "ΥΠΟΥΡΓΕΙΟ ΑΝΑΠΤΥΞΗΣ" },
  { siteId: 29, name: "ΥΠΟΥΡΓΕΙΟ ΕΣΩΤΕΡΙΚΩΝ" },
  { siteId: 31, name: "ΥΠΟΥΡΓΕΙΟ ΔΙΚΑΙΟΣΥΝΗΣ" },
  { siteId: 32, name: "ΥΠΟΥΡΓΕΙΟ ΕΘΝΙΚΗΣ ΑΜΥΝΑΣ" },
  { siteId: 35, name: "ΥΠΟΥΡΓΕΙΟ ΕΡΓΑΣΙΑΣ ΚΑΙ ΚΟΙΝΩΝΙΚΗΣ ΑΣΦΑΛΙΣΗΣ" },
  { siteId: 36, name: "ΥΠΟΥΡΓΕΙΟ ΕΞΩΤΕΡΙΚΩΝ" },
  { siteId: 41, name: "ΥΠΟΥΡΓΕΙΟ ΠΑΙΔΕΙΑΣ ΘΡΗΣΚΕΥΜΑΤΩΝ ΚΑΙ ΑΘΛΗΤΙΣΜΟΥ" },
  { siteId: 42, name: "ΥΠΟΥΡΓΕΙΟ ΠΕΡΙΒΑΛΛΟΝΤΟΣ ΚΑΙ ΕΝΕΡΓΕΙΑΣ" },
  { siteId: 46, name: "ΥΠΟΥΡΓΕΙΟ ΥΓΕΙΑΣ" },
  { siteId: 47, name: "ΥΠΟΥΡΓΕΙΟ ΥΠΟΔΟΜΩΝ ΚΑΙ ΜΕΤΑΦΟΡΩΝ" },
  { siteId: 33, name: "ΥΠΟΥΡΓΕΙΟ ΕΘΝΙΚΗΣ ΟΙΚΟΝΟΜΙΑΣ ΚΑΙ ΟΙΚΟΝΟΜΙΚΩΝ" },
];

function findSiteId(organizationName: string): number | null {
  const query = normalizeText(organizationName);
  if (!query) return null;

  const exact = SITE_ID_MAP.find((e) => normalizeText(e.name) === query);
  if (exact) return exact.siteId;

  const partial = SITE_ID_MAP.find((e) => {
    const normalized = normalizeText(e.name);
    return normalized.includes(query) || query.includes(normalized);
  });

  return partial ? partial.siteId : null;
}

export interface OpenGovConsultationCount {
  /** Consultations currently published for this body. */
  count: number;
  /** False when the body has no site_id at all, which is not the same as zero. */
  siteKnown: boolean;
}

/**
 * How many consultations an organization currently has published.
 *
 * Two things make this a small number by nature, and both belong in any label put
 * on it. The endpoint returns what is published *now*, not a historical archive —
 * measured across all 48 known sites, the whole network held 12 consultations, with
 * no single body above 2. And only those 48 bodies have a site_id at all: every
 * municipality, hospital and court is absent from the network entirely.
 *
 * So `siteKnown: false` means "not on opengov.gr", which must not be rendered as a
 * zero — that would read as "this body runs no consultations".
 */
export async function getOpenGovConsultationCount(
  organizationName: string,
): Promise<OpenGovConsultationCount> {
  const siteId = findSiteId(organizationName);
  if (!siteId) return { count: 0, siteKnown: false };

  try {
    // per_page=1 because only the X-WP-Total header is wanted, not the payload.
    const response = await fetch(
      `https://opengov.gr/wp-json/opengov/v1/subsite-posts?site_id=${siteId}&per_page=1`,
      { headers: { Accept: "application/json" }, next: { revalidate: 3600 } },
    );
    if (!response.ok) return { count: 0, siteKnown: true };

    const total = Number(response.headers.get("x-wp-total") ?? 0);
    return { count: Number.isFinite(total) ? total : 0, siteKnown: true };
  } catch (error) {
    console.error(`OpenGov count failed for "${organizationName}":`, error);
    return { count: 0, siteKnown: true };
  }
}

/**
 * Fetches published consultations (διαβουλεύσεις) for an organization from opengov.gr.
 * Returns null when the organization has no known site_id in the network.
 * Only title/link/dates/status are kept — the API's full payload also carries heavy
 * acf_fields/content blobs (attachments, section HTML, etc.) we deliberately don't retain.
 */
export async function getOpenGovConsultations(
  organizationName: string,
  perPage: number = 5,
): Promise<OpenGovConsultation[] | null> {
  if (!organizationName) return null;

  const siteId = findSiteId(organizationName);
  if (!siteId) return null;

  try {
    const params = new URLSearchParams({
      site_id: String(siteId),
      per_page: String(perPage),
    });

    const url = `https://opengov.gr/wp-json/opengov/v1/subsite-posts?${params.toString()}`;

    // One or the other, never both: `cache: "no-store"` and `revalidate` are
    // contradictory and Next warns about it. Consultations change on the order of
    // days, so the hour-long revalidate is the one worth keeping.
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(
        `OpenGov API returned status ${response.status} for site_id ${siteId}`,
      );
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data)) return null;

    return data.map((item: any) => {
      const { status, statusLabel } = resolveStatus(item.status);

      return {
        id: item.id,
        title: item.title || "",
        link: item.permalink || "",
        publishDate: item.acf_fields?.publish_date || item.date_gmt || "",
        expiryDate: item.acf_fields?.expiry_date || null,
        status,
        statusLabel,
      };
    });
  } catch (error) {
    console.error(
      `Error fetching OpenGov consultations for "${organizationName}":`,
      error,
    );
    return null;
  }
}
