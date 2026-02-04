// lib/diavgeia-helper.ts

export interface DiavgeiaDecision {
  ada: string;
  protocolNumber: string;
  subject: string;
  issueDate: string;
  publishTimestamp: string;
  documentUrl: string;
  organizationLabel: string;
  decisionTypeLabel: string;
  status: string;
}

export interface DiavgeiaUnit {
  uid: string;
  label: string;
}

export interface DiavgeiaOrganization {
  uid: string;
  label: string;
  status?: string;
  category?: string;
  latinLabel?: string;
  abbr?: string;
  supervised?: boolean;
  vatNumber?: string;
  organizationId?: string;
  website?: string;
  email?: string;
  fax?: string;
  telephone?: string;
  address?: {
    postalCode?: string;
    city?: string;
    streetName?: string;
    streetNumber?: string;
  };
  fekType?: string; // Πρόσθεσε το ? γιατί μπορεί να λείπει
  fekNumber?: number;
  fekYear?: number;
  units?: DiavgeiaUnit[]; // Νέο πεδίο
  latestDecisions?: DiavgeiaDecision[]; // Νέο πεδίο
}

export const FEK_TYPE_MAP: Record<string, string> = {
  fektype_A: "Τεύχος Πρώτο (Α)",
  fektype_B: "Τεύχος Δεύτερο (Β)",
  fektype_C: "Τεύχος Τρίτο (Γ)",
  fektype_D: "Τεύχος Τέταρτο (Δ)",
  fektype_AAP:
    "Τεύχος Αναγκαστικών Απαλλοτριώσεων και Πολεοδομικών Θεμάτων (Α.Α.Π)",
  fektype_EBI: "Τεύχος Εμπορικής και Βιομηχανικής Ιδιοκτησίας (Ε.Β.Ι.)",
  fektype_ASEP: "Τεύχος Προκηρύξεων ΑΣΕΠ",
  fektype_DDS: "Τεύχος Διακηρύξεων Δημοσίων Συμβάσεων (Δ.Δ.Σ.)",
  fektype_AED: "Τεύχος Ανωτάτου Ειδικού Δικαστηρίου (Α.Ε.Δ.)",
  fektype_OPK: "Τεύχος Οικονομικών των Πολιτικών Κομμάτων (Ο.Π.Κ.)",
  fektype_NPDD: "Τεύχος Νομικών Προσώπων Δημοσίου Δικαίου (Ν.Π.Δ.Δ)",
  fektype_APS: "Τεύχος Αναπτυξιακών Πράξεων (Α.Π.Σ.)",
  fektype_APPENDIX: "Τεύχος Παράρτημα (ΠΑΡΑΡΤΗΜΑ)",
};

export const getFekLabel = (fekType: string | undefined | null): string => {
  if (!fekType) return "-";
  return FEK_TYPE_MAP[fekType] || fekType; // Αν δεν βρεθεί, επιστρέφει το κωδικό
};

/**
 * Normalize text for comparison
 * Αλλαγή: Αφαιρούμε ΟΛΑ τα σύμβολα, κρατάμε μόνο γράμματα και αριθμούς.
 */
const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Αφαίρεση τόνων
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]/g, ""); // Κρατάμε ΜΟΝΟ γράμματα και αριθμούς
};

export async function getDiavgeiaData(
  organizationName: string
): Promise<DiavgeiaOrganization | null> {
  if (!organizationName) return null;

  try {
    const searchTerm = organizationName
      .trim()
      .replace(/\s+/g, " ") // Μετατροπή πολλαπλών κενών σε ένα
      .replace(/\s*-\s*/g, " - "); // Μετατροπή του "-" ή " -" ή "- " σε

    const params = new URLSearchParams({
      term: searchTerm,
    });

    const url = `https://diavgeia.gov.gr/luminapi/api/organizations?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `Diavgeia API returned status ${response.status} for: ${organizationName}`
      );
      return null;
    }

    const data = await response.json();

    if (!data.organizations || !Array.isArray(data.organizations)) {
      return null;
    }

    const normalizedQuery = normalizeText(organizationName);

    // 1. Exact match (με βάση το normalized string)
    let match = data.organizations.find((org: any) => {
      const normalizedLabel = normalizeText(org.label || "");
      return normalizedLabel === normalizedQuery;
    });

    if (!match && data.organizations.length > 0) {
      match = data.organizations.find((org: any) => {
        const normalizedLabel = normalizeText(org.label || "");
        return (
          normalizedLabel.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedLabel)
        );
      });
    }

    if (!match && data.organizations.length > 0) {
      match = data.organizations[0];
    }

    if (!match) {
      return null;
    }

    const uid = match.uid;

    // --- PARALLEL FETCHING FOR EXTRA DATA ---
    const [units, decisions] = await Promise.all([
      getOrganizationUnits(uid),
      getRecentDecisions(uid),
    ]);

    return {
      uid: match.uid || "",
      label: match.label || "",
      status: match.status || undefined,
      category: match.category || undefined,
      latinLabel: match.latinName || undefined,
      abbr: match.abbr || undefined,
      supervised: match.supervised || undefined,
      vatNumber: match.vatNumber || undefined,
      organizationId: match.organizationId || undefined,
      website: match.website || undefined,
      email: match.emailContact || undefined,
      fax: match.fax || undefined,
      telephone: match.telephone || undefined,
      address: match.organizationBuildings[0]?.address || undefined,
      fekType: match.fekType || undefined,
      fekYear: match.fekYear || undefined,
      fekNumber: match.fekNumber || undefined,
      units: units, // Added
      latestDecisions: decisions, // Added
    };
  } catch (error) {
    console.error("Error fetching Diavgeia data:", error);
    return null;
  }
}

/**
 * Fetches organization data from Diavgeia API by UID
 * @param uid - The Diavgeia UID
 * @returns Detailed organization data or null if not found
 */
export async function getDiavgeiaDataByUid(
  uid: string
): Promise<DiavgeiaOrganization | null> {
  if (!uid) return null;

  try {
    const url = `https://diavgeia.gov.gr/luminapi/api/organizations/${uid}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(
        `Diavgeia API returned status ${response.status} for UID: ${uid}`
      );
      return null;
    }

    const data = await response.json();

    if (!data) {
      return null;
    }

    return {
      uid: data.uid || "",
      label: data.label || "",
      status: data.status || undefined,
      category: data.category || undefined,
      latinLabel: data.latinLabel || undefined,
      abbr: data.abbr || undefined,
      supervised: data.supervised || undefined,
      vatNumber: data.vatNumber || undefined,
      organizationId: data.organizationId || undefined,
      website: data.website || undefined,
      email: data.email || undefined,
      fax: data.fax || undefined,
      telephone: data.telephone || undefined,
      address: data.address || undefined,
      fekType: getFekLabel(data.fekType),
      fekNumber: data.fekNumber,
      fekYear: data.fekYear,
    };
  } catch (error) {
    console.error("Error fetching Diavgeia data by UID:", error);
    return null;
  }
}

async function getOrganizationUnits(uid: string): Promise<DiavgeiaUnit[]> {
  try {
    const url = `https://diavgeia.gov.gr/luminapi/api/organizations/${uid}/units`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.organizationUnits || !Array.isArray(data.organizationUnits))
      return [];

    return data.organizationUnits.map((item: any) => ({
      uid: item.organizationDTO.uid,
      label: item.organizationDTO.label,
    }));
  } catch (error) {
    console.error(`Error fetching units for ${uid}:`, error);
    return [];
  }
}

async function getRecentDecisions(uid: string): Promise<DiavgeiaDecision[]> {
  try {
    // URL Encode the query parameter properly
    const query = encodeURIComponent(`organizationUid:"${uid}"`);
    const url = `https://diavgeia.gov.gr/luminapi/api/search?facet=false&page=0&q=${query}&sort=recent&size=5`; // Limit to 5

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store", // Decisions need to be fresh
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.decisions || !Array.isArray(data.decisions)) return [];

    return data.decisions.map((d: any) => ({
      ada: d.ada,
      protocolNumber: d.protocolNumber,
      subject: d.subject,
      issueDate: d.issueDate, // "31/01/2026 02:00:00"
      publishTimestamp: d.publishTimestamp,
      documentUrl: d.documentUrl, // "https://diavgeia.gov.gr/doc/..."
      organizationLabel: d.organization?.label || "",
      decisionTypeLabel: d.decisionType?.label || "",
      status: d.status,
    }));
  } catch (error) {
    console.error(`Error fetching decisions for ${uid}:`, error);
    return [];
  }
}
