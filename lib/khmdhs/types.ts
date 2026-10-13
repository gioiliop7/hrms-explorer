// lib/khmdhs/types.ts

/** The five act types published by ΚΗΜΔΗΣ, each with its own search endpoint. */
export type KhmdhsActType =
  | "request"
  | "notice"
  | "auction"
  | "contract"
  | "payment";

export const ACT_TYPES: KhmdhsActType[] = [
  "request",
  "notice",
  "auction",
  "contract",
  "payment",
];

/** Greek labels and ΑΔΑΜ infixes, keyed by act type. */
export const ACT_TYPE_META: Record<
  KhmdhsActType,
  { label: string; shortLabel: string; adamInfix: string }
> = {
  request: {
    label: "Πρωτογενή Αιτήματα",
    shortLabel: "Αιτήματα",
    adamInfix: "REQ",
  },
  notice: {
    label: "Προκηρύξεις & Διακηρύξεις",
    shortLabel: "Προκηρύξεις",
    adamInfix: "PROC",
  },
  auction: {
    label: "Κατακυρώσεις & Αναθέσεις",
    shortLabel: "Αναθέσεις",
    adamInfix: "AWRD",
  },
  contract: { label: "Συμβάσεις", shortLabel: "Συμβάσεις", adamInfix: "SYMV" },
  payment: { label: "Πληρωμές", shortLabel: "Πληρωμές", adamInfix: "PAY" },
};

/** ΚΗΜΔΗΣ returns most coded values as this key/label pair. */
export interface KhmdhsCodedValue {
  key: string | null;
  value: string | null;
}

/** One line item of an act (αντικείμενο σύμβασης). */
export interface KhmdhsObjectDetail {
  quantity: number | null;
  unit: string | null;
  costWithoutVAT: number | null;
  vat: string | null;
  currency: string | null;
  shortDescription: string | null;
  cpvs: { code: string; label: string }[];
}

/** A supplier/contractor named on an award or contract. */
export interface KhmdhsContractor {
  name: string;
  vatNumber: string | null;
  greekVatNumber: boolean;
  country: string | null;
}

/**
 * One ΚΗΜΔΗΣ act, normalized across the five endpoints.
 *
 * The upstream payloads differ in ways that are incidental rather than meaningful —
 * the signing date is `contractSignedDate` on contracts but `signedDate` everywhere
 * else, line items are `objectDetailsList` on contracts and awards but `objectDetails`
 * on the rest, and requests carry `contractTypes[]` where the others carry a single
 * `contractType`. Normalizing here keeps that noise out of the UI and the CSV export.
 */
export interface KhmdhsAct {
  actType: KhmdhsActType;
  /** ΑΔΑΜ, e.g. "25SYMV016238593". */
  referenceNumber: string;
  title: string;
  /** ISO date (YYYY-MM-DD) the act was signed; null when upstream omits it. */
  signedDate: string | null;
  /** ISO timestamp the act was submitted to ΚΗΜΔΗΣ. */
  submissionDate: string | null;
  protocolNumber: string | null;
  organizationKey: string | null;
  organizationName: string | null;
  /** Το τμήμα/μονάδα που διενεργεί — often more specific than the authority. */
  unitName: string | null;
  contractType: string | null;
  procedureType: string | null;
  nutsLabel: string | null;
  totalCostWithoutVAT: number | null;
  totalCostWithVAT: number | null;
  cancelled: boolean;
  cancellationDate: string | null;
  /** ΑΔΑ of the related Διαύγεια decision, when the authority filled it in. */
  diavgeiaADA: string | null;
  contractors: KhmdhsContractor[];
  objectDetails: KhmdhsObjectDetail[];
  /** Distinct CPV codes across all line items, for grouping and filtering. */
  cpvCodes: { code: string; label: string }[];
  /** URL of the act's PDF on ΚΗΜΔΗΣ. */
  attachmentUrl: string;
}

/** A contracting authority in the harvested registry. */
export interface KhmdhsOrganization {
  key: string;
  name: string;
  actCount: number;
}

/**
 * Aggregate figures for one act type over the queried period.
 *
 * `count` is exact — it comes from the API's own `totalElements` and costs a single
 * request. The money figures are not: summing them requires walking every page, and
 * an active ministry publishes thousands of acts a year. So they are sums over the
 * acts actually fetched, and `complete` says whether that was all of them. A partial
 * sum must never be presented as a total.
 */
export interface KhmdhsActTypeSummary {
  actType: KhmdhsActType;
  /** Exact number of acts in the period. */
  count: number;
  /** How many acts were fetched and included in the sums below. */
  sampledCount: number;
  /** True when sampledCount === count, i.e. the sums really are totals. */
  complete: boolean;
  sampledCostWithoutVAT: number;
  sampledCostWithVAT: number;
  /** Cancelled acts within the sample. */
  cancelledCount: number;
}

/** Everything the UI needs for one organization's ΚΗΜΔΗΣ presence. */
export interface KhmdhsOrganizationData {
  organization: KhmdhsOrganization;
  /** Whether the registry match was exact or a normalized/partial fallback. */
  matchConfidence: "exact" | "partial";
  dateFrom: string;
  dateTo: string;
  summaries: KhmdhsActTypeSummary[];
  /** Most recent acts across all requested types, newest first. */
  recentActs: KhmdhsAct[];
  /**
   * CPV codes ranked by spend, for the "what do they buy" view. Computed over the
   * acts actually fetched — see `truncated`.
   */
  topCpvs: { code: string; label: string; count: number; totalCost: number }[];
  /** Contractors ranked by contracted value, over the same sample as `topCpvs`. */
  topContractors: {
    name: string;
    vatNumber: string | null;
    count: number;
    totalCost: number;
  }[];
  /**
   * True when at least one act type had more acts than were fetched. The rankings
   * and money figures then describe a recent sample, not the whole period.
   */
  truncated: boolean;
  /**
   * True when every act type's lookup failed — rate limiting or an upstream outage.
   *
   * Distinct from the organization being absent from the register, which is
   * signalled by getKhmdhsData returning null. Conflating the two would tell a user
   * that an authority files no public contracts when in fact ΚΗΜΔΗΣ was unreachable.
   */
  fetchFailed: boolean;
}

/** Spring's `Page<T>` wrapper, which every ΚΗΜΔΗΣ search returns. */
export interface KhmdhsPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

/** Search filters shared by all five endpoints. */
export interface KhmdhsSearchFilters {
  organizations?: number[];
  title?: string;
  cpvItems?: string[];
  referenceNumber?: string;
  contractType?: number;
  /** YYYY-MM-DD. */
  dateFrom?: string;
  /** YYYY-MM-DD. ΚΗΜΔΗΣ clamps ranges wider than 180 days. */
  dateTo?: string;
  totalCostFrom?: number;
  totalCostTo?: number;
}
