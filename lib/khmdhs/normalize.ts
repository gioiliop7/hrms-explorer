// lib/khmdhs/normalize.ts
//
// Flattens the five ΚΗΜΔΗΣ act payloads into the single KhmdhsAct shape.
//
// The endpoints were clearly built independently: the same concept carries a
// different field name on almost every one of them. The table below is the whole
// of that divergence, and everything downstream reads the normalized shape.
//
//   concept          request            notice          auction                 contract                payment
//   ---------------  -----------------  --------------  ----------------------  ----------------------  -----------------
//   signing date     signedDate         signedDate      signedDate              contractSignedDate      signedDate
//   line items       objectDetails      objectDetails   objectDetailsList       objectDetailsList       objectDetails
//   contracting      contractingData    contractingData contractingDataDetails  contractingDataDetails  contractingData
//   contract type    contractTypes[]    contractType    contractType            contractType            contractType
//   procedure        procedureType      typeOfProcedure procedureType           procedureType           procedureType
//   contractors      —                  —               ✓                       ✓                       —

import { attachmentUrl } from "./client.ts";
import type {
  KhmdhsAct,
  KhmdhsActType,
  KhmdhsCodedValue,
  KhmdhsContractor,
  KhmdhsObjectDetail,
} from "./types.ts";

// The upstream payloads are what this module exists to tame: five endpoints, no
// published schema, and fields that appear, vanish or change shape between them.
// Typing the input would be inventing a contract ΚΗΜΔΗΣ does not offer — the
// accessors below do the narrowing, and KhmdhsAct is the typed output.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function label(value: unknown): string | null {
  if (!value) return null;
  const coded = value as KhmdhsCodedValue;
  return coded.value?.trim() || null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * ΚΗΜΔΗΣ mixes plain dates ("2025-01-30") with timestamps ("2025-02-27T00:00:00")
 * in the same field across act types. Only the calendar day is meaningful here.
 */
function isoDate(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const day = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function normalizeObjectDetails(raw: Raw): KhmdhsObjectDetail[] {
  const items: Raw[] = raw.objectDetailsList ?? raw.objectDetails ?? [];
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    quantity: num(item?.quantity),
    unit: label(item?.type),
    costWithoutVAT: num(item?.costWithoutVAT),
    vat: text(item?.vat),
    currency: label(item?.currency),
    shortDescription: text(item?.shortDescription),
    cpvs: Array.isArray(item?.cpvs)
      ? item.cpvs
          .filter((cpv: Raw) => cpv?.key)
          .map((cpv: Raw) => ({
            code: String(cpv.key),
            label: cpv.value?.trim() ?? "",
          }))
      : [],
  }));
}

function normalizeContractors(raw: Raw): KhmdhsContractor[] {
  // Only awards and contracts name the other side of the deal.
  const members: Raw[] =
    raw.contractingDataDetails?.contractingMembersDataList ?? [];
  if (!Array.isArray(members)) return [];

  return members
    .filter((member) => text(member?.name))
    .map((member) => ({
      name: text(member.name)!,
      vatNumber: text(member.vatNumber),
      greekVatNumber: Boolean(member.greekVatNumber),
      country: label(member.country),
    }));
}

function normalizeContractType(raw: Raw): string | null {
  // Requests carry a list of wrapped types; every other act carries one directly.
  if (Array.isArray(raw.contractTypes) && raw.contractTypes.length > 0) {
    const labels = raw.contractTypes
      .map((entry: Raw) => label(entry?.contractType))
      .filter(Boolean);
    return labels.length ? labels.join(", ") : null;
  }
  return label(raw.contractType);
}

/** Distinct CPVs across line items, preserving first-seen order. */
function collectCpvs(
  details: KhmdhsObjectDetail[],
): { code: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const detail of details) {
    for (const cpv of detail.cpvs) {
      if (!seen.has(cpv.code)) seen.set(cpv.code, cpv.label);
    }
  }
  return [...seen].map(([code, cpvLabel]) => ({ code, label: cpvLabel }));
}

export function normalizeAct(actType: KhmdhsActType, raw: Raw): KhmdhsAct {
  const objectDetails = normalizeObjectDetails(raw);
  const contracting = raw.contractingDataDetails ?? raw.contractingData ?? {};

  return {
    actType,
    referenceNumber: text(raw.referenceNumber) ?? "",
    title: text(raw.title) ?? "(χωρίς τίτλο)",
    // Contracts date themselves by signature; the rest use `signedDate`. Fall back
    // to the submission timestamp so an act never sorts as undated.
    signedDate:
      isoDate(raw.contractSignedDate) ??
      isoDate(raw.signedDate) ??
      isoDate(raw.submissionDate),
    submissionDate: text(raw.submissionDate),
    protocolNumber: text(raw.protocolNumber),
    organizationKey: text(raw.organization?.key),
    organizationName: label(raw.organization),
    unitName: label(contracting.unitsOperator),
    contractType: normalizeContractType(raw),
    procedureType: label(raw.typeOfProcedure) ?? label(raw.procedureType),
    nutsLabel: label(raw.nutsCode),
    totalCostWithoutVAT: num(raw.totalCostWithoutVAT),
    totalCostWithVAT: num(raw.totalCostWithVAT),
    cancelled: Boolean(raw.cancelled),
    cancellationDate: isoDate(raw.cancellationDate),
    diavgeiaADA:
      text(raw.diavgeiaADA) ??
      text(raw.contractRelatedADA?.number3) ??
      text(raw.commitmentNo),
    contractors: normalizeContractors(raw),
    objectDetails,
    cpvCodes: collectCpvs(objectDetails),
    attachmentUrl: attachmentUrl(actType, text(raw.referenceNumber) ?? ""),
  };
}
