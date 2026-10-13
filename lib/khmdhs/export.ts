// lib/khmdhs/export.ts
//
// CSV shapes for ΚΗΜΔΗΣ data.
//
// Imports nothing but types, so client components can pull these in without
// dragging the server-side fetch code — or the 1.373-entry organization register —
// into the browser bundle.

import type { CsvColumn } from "@/lib/csv";
import { ACT_TYPE_META, type KhmdhsAct } from "./types.ts";

/**
 * One row per act.
 *
 * Contractors and CPVs are many-per-act and are joined into a single cell rather
 * than exploded into extra rows: keeping one row per ΑΔΑΜ is what lets the file be
 * pivoted or summed in a spreadsheet without double-counting the value.
 */
export const actCsvColumns: CsvColumn<KhmdhsAct>[] = [
  { header: "ΑΔΑΜ", value: (a) => a.referenceNumber },
  {
    // The Greek label, not the endpoint slug: "Συμβάσεις" is what the reader of a
    // spreadsheet needs, and "contract" is an implementation detail of the API.
    header: "Τύπος πράξης",
    value: (a) => ACT_TYPE_META[a.actType].shortLabel,
  },
  { header: "Τίτλος", value: (a) => a.title },
  { header: "Ημ/νία υπογραφής", value: (a) => a.signedDate },
  { header: "Αρ. πρωτοκόλλου", value: (a) => a.protocolNumber },
  { header: "Φορέας", value: (a) => a.organizationName },
  { header: "Μονάδα", value: (a) => a.unitName },
  { header: "Είδος σύμβασης", value: (a) => a.contractType },
  { header: "Διαδικασία", value: (a) => a.procedureType },
  { header: "Περιοχή (NUTS)", value: (a) => a.nutsLabel },
  { header: "Αξία χωρίς ΦΠΑ", value: (a) => a.totalCostWithoutVAT },
  { header: "Αξία με ΦΠΑ", value: (a) => a.totalCostWithVAT },
  { header: "Ακυρωμένη", value: (a) => a.cancelled },
  { header: "Ημ/νία ακύρωσης", value: (a) => a.cancellationDate },
  {
    header: "Ανάδοχοι",
    value: (a) => a.contractors.map((c) => c.name).join(" | "),
  },
  {
    header: "ΑΦΜ αναδόχων",
    value: (a) => a.contractors.map((c) => c.vatNumber ?? "—").join(" | "),
  },
  {
    header: "Κωδικοί CPV",
    value: (a) => a.cpvCodes.map((c) => c.code).join(" | "),
  },
  {
    header: "Περιγραφή CPV",
    value: (a) => a.cpvCodes.map((c) => c.label).join(" | "),
  },
  { header: "ΑΔΑ Διαύγειας", value: (a) => a.diavgeiaADA },
  { header: "Σύνδεσμος PDF", value: (a) => a.attachmentUrl },
];
