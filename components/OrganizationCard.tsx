"use client";

import {
  Building2,
  MapPin,
  FileText,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Landmark,
  Building,
  UserCheck,
  Shield,
  Hash,
  CalendarDays,
  Globe,
  ExternalLink,
  Eye,
  Network, // Added for Units
  Gavel, // Added for Decisions
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import type { FMitrooForeasDto } from "@/types/api";
import { ENTITY_TYPE_MAP, formatDate } from "@/lib/utils";
import { getFekLabel } from "@/lib/diavgeia";
import { useState } from "react";

interface MitosProcess {
  id: string;
  title: string;
  link: string | null;
}

interface GsisData {
  aahtCode: string;
  aahtAfm: string;
  aahtName: string;
  authority: string;
  authorityType: string;
  supervisor: string;
  ministry: string;
  clearingServiceCode: string;
  clearingService: string;
  aahtCodeStartDate: string;
  aahtCodeEndDate: string;
  clearingServiceConnectionStartDate: string;
  clearingServiceConnectionEndDate: string;
}

interface DiavgeiaUnit {
  uid: string;
  label: string;
}

interface DiavgeiaDecision {
  ada: string;
  protocolNumber: string;
  subject: string;
  issueDate: string;
  documentUrl: string;
  organizationLabel: string;
  decisionTypeLabel: string;
  status: string;
}

interface DiavgeiaData {
  fekYear: string;
  fekNumber: any;
  fekType: string;
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
    poBox: any;
    country: any;
    postalCode?: string;
    city?: string;
    streetName?: string;
    streetNumber?: string;
  };
  units?: DiavgeiaUnit[];
  latestDecisions?: DiavgeiaDecision[];
}

interface ExtendedOrganization extends FMitrooForeasDto {
  elstat?: {
    code: string;
    description: string;
    sheetName: string;
  } | null;
  gsis?: GsisData[] | null;
  diavgeia?: DiavgeiaData | null;
  mitos?: {
    total: number;
    procedures: MitosProcess[];
  } | null;
}

interface OrganizationCardProps {
  organization: ExtendedOrganization;
  onShowPositions: () => void;
}

export default function OrganizationCard({
  organization,
  onShowPositions,
}: OrganizationCardProps) {
  const [activeTab, setActiveTab] = useState<"info" | "mitos">("info");
  const address = organization.mainAddress;
  const fek = organization.foundationFek;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4 flex-col md:flex-row">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-sm md:text-2xl font-bold text-gray-900">
                {organization.preferredLabel}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Κωδικός: {organization.code}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Τύπος: {ENTITY_TYPE_MAP[organization.organizationType]}
              </p>
            </div>

            {/* View Positions Button */}
            <button
              onClick={onShowPositions}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
            >
              <Briefcase className="h-4 w-4" />
              <span>Θέσεις Εργασίας Φορέα</span>
            </button>
          </div>
        </div>
      </div>

      {/* ELSTAT Info */}
      {organization.elstat && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-3">
          <div className="p-1.5 bg-white rounded-md border border-slate-100 shadow-sm">
            <Landmark className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Μητρώο Φορέων Γενικής Κυβέρνησης (ΕΛΣΤΑΤ)
            </p>
            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
              <span className="font-medium text-slate-900">
                {organization.elstat.description}
              </span>
              <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-mono">
                {organization.elstat.code}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GSIS Info */}
      {organization.gsis && organization.gsis.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-white rounded-md border border-emerald-100 shadow-sm">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">
                Στοιχεία ΓΓΠΣ (Γενική Γραμματεία Πληροφοριακών Συστημάτων)
              </p>

              {organization.gsis.map((gsis, idx) => (
                <div
                  key={idx}
                  className={`${
                    idx > 0 ? "mt-3 pt-3 border-t border-emerald-200" : ""
                  }`}
                >
                  {/* Primary Info */}
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">
                          Κωδικός ΑΑΔΕ
                        </p>
                        <p className="text-sm font-mono text-gray-900">
                          {gsis.aahtCode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">
                          ΑΦΜ
                        </p>
                        <p className="text-sm font-mono text-gray-900">
                          {gsis.aahtAfm}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Organization Details */}
                  <div className="space-y-2">
                    {gsis.aahtName && (
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">
                            Επωνυμία ΑΑΔΕ
                          </p>
                          <p className="text-sm text-gray-900">
                            {gsis.aahtName}
                          </p>
                        </div>
                      </div>
                    )}

                    {gsis.authority && (
                      <div className="flex items-start gap-2">
                        <UserCheck className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">
                            Αρχή
                          </p>
                          <p className="text-sm text-gray-900">
                            {gsis.authority}
                          </p>
                        </div>
                      </div>
                    )}

                    {gsis.authorityType && (
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">
                            Τύπος Αρχής
                          </p>
                          <p className="text-sm text-gray-900">
                            {gsis.authorityType}
                          </p>
                        </div>
                      </div>
                    )}

                    {gsis.supervisor && (
                      <div className="flex items-start gap-2">
                        <UserCheck className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">
                            Εποπτεύουσα Αρχή
                          </p>
                          <p className="text-sm text-gray-900">
                            {gsis.supervisor}
                          </p>
                        </div>
                      </div>
                    )}

                    {gsis.ministry && (
                      <div className="flex items-start gap-2">
                        <Landmark className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">
                            Υπουργείο
                          </p>
                          <p className="text-sm text-gray-900">
                            {gsis.ministry}
                          </p>
                        </div>
                      </div>
                    )}

                    {gsis.clearingService && (
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-600 font-medium">
                            Υπηρεσία Εκκαθάρισης
                          </p>
                          <p className="text-sm text-gray-900">
                            {gsis.clearingService}
                            {gsis.clearingServiceCode && (
                              <span className="ml-2 text-xs font-mono bg-emerald-100 px-2 py-0.5 rounded">
                                {gsis.clearingServiceCode}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Dates Section */}
                    {(gsis.aahtCodeStartDate ||
                      gsis.aahtCodeEndDate ||
                      gsis.clearingServiceConnectionStartDate ||
                      gsis.clearingServiceConnectionEndDate) && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <p className="text-xs text-emerald-600 font-semibold mb-2">
                          Ημερομηνίες
                        </p>
                        <div className="grid md:grid-cols-2 gap-2 text-xs">
                          {gsis.aahtCodeStartDate && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600">
                                Έναρξη Κωδικού:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {gsis.aahtCodeStartDate}
                              </span>
                            </div>
                          )}
                          {gsis.aahtCodeEndDate && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600">
                                Λήξη Κωδικού:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {gsis.aahtCodeEndDate}
                              </span>
                            </div>
                          )}
                          {gsis.clearingServiceConnectionStartDate && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600">
                                Έναρξη Σύνδεσης:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {gsis.clearingServiceConnectionStartDate}
                              </span>
                            </div>
                          )}
                          {gsis.clearingServiceConnectionEndDate && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-600">
                                Λήξη Σύνδεσης:
                              </span>
                              <span className="text-gray-900 font-medium">
                                {gsis.clearingServiceConnectionEndDate}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diavgeia Info */}
      {organization.diavgeia && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3 flex-col md:flex-row">
            <div className="p-1.5 bg-white rounded-md border border-indigo-100 shadow-sm">
              <Eye className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="w-full">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">
                Στοιχεία Διαύγειας (Πρόγραμμα Διαύγεια)
              </p>

              {/* Primary Info */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-indigo-600 font-medium">
                      UID Διαύγειας
                    </p>
                    <p className="text-sm font-mono text-gray-900">
                      {organization.diavgeia.uid}
                    </p>
                  </div>
                </div>

                {organization.diavgeia.label && (
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">
                        Επωνυμία Διαύγειας
                      </p>
                      <p className="text-sm text-gray-900">
                        {organization.diavgeia.label}
                      </p>
                    </div>
                  </div>
                )}

                {organization.diavgeia.latinLabel && (
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">
                        Λατινική Επωνυμία
                      </p>
                      <p className="text-sm text-gray-900">
                        {organization.diavgeia.latinLabel}
                      </p>
                    </div>
                  </div>
                )}

                {organization.diavgeia.abbr && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">
                        Συντομογραφία
                      </p>
                      <p className="text-sm text-gray-900">
                        {organization.diavgeia.abbr}
                      </p>
                    </div>
                  </div>
                )}

                {organization.diavgeia.category && (
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">
                        Κατηγορία
                      </p>
                      <p className="text-sm text-gray-900">
                        {organization.diavgeia.category}
                      </p>
                    </div>
                  </div>
                )}

                {organization.diavgeia.status && (
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          organization.diavgeia.status === "ACTIVE"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      ></span>
                      <p className="text-xs text-indigo-600 font-medium">
                        Κατάσταση
                      </p>
                    </div>
                    <p className="text-sm text-gray-900">
                      {organization.diavgeia.status}
                    </p>
                  </div>
                )}

                {organization.diavgeia.vatNumber && (
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">ΑΦΜ</p>
                      <p className="text-sm font-mono text-gray-900">
                        {organization.diavgeia.vatNumber}
                      </p>
                    </div>
                  </div>
                )}

                {organization.diavgeia.organizationId && (
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">
                        Organization ID
                      </p>
                      <p className="text-sm font-mono text-gray-900">
                        {organization.diavgeia.organizationId}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {(organization.diavgeia.email ||
                  organization.diavgeia.telephone ||
                  organization.diavgeia.fax ||
                  organization.diavgeia.website) && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-indigo-600 font-semibold mb-2">
                      Στοιχεία Επικοινωνίας
                    </p>
                    <div className="space-y-2">
                      {organization.diavgeia.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-indigo-500" />
                          <a
                            href={`mailto:${organization.diavgeia.email}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {organization.diavgeia.email}
                          </a>
                        </div>
                      )}
                      {organization.diavgeia.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-indigo-500" />
                          <a
                            href={`tel:${organization.diavgeia.telephone}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {organization.diavgeia.telephone}
                          </a>
                        </div>
                      )}
                      {organization.diavgeia.fax && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-indigo-500" />
                          <span className="text-gray-900">
                            Fax: {organization.diavgeia.fax}
                          </span>
                        </div>
                      )}
                      {organization.diavgeia.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-3 w-3 text-indigo-500" />
                          <a
                            href={organization.diavgeia.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            {organization.diavgeia.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === NEW SECTION: Organization Units (Μονάδες) === */}
                {organization.diavgeia.units &&
                  organization.diavgeia.units.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="h-4 w-4 text-indigo-600" />
                        <p className="text-xs text-indigo-600 font-semibold">
                          Οργανωτικές Μονάδες στη Διαύγεια (
                          {organization.diavgeia.units.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {organization.diavgeia.units.map((unit) => (
                          <span
                            key={unit.uid}
                            className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-indigo-100 text-xs text-indigo-700 shadow-sm"
                            title={`UID: ${unit.uid}`}
                          >
                            {unit.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* === NEW SECTION: Recent Decisions (Αποφάσεις) === */}
                {organization.diavgeia.latestDecisions &&
                  organization.diavgeia.latestDecisions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Gavel className="h-4 w-4 text-indigo-600" />
                        <p className="text-xs text-indigo-600 font-semibold">
                          Πρόσφατες Αποφάσεις
                        </p>
                      </div>
                      <div className="space-y-2">
                        {organization.diavgeia.latestDecisions.map(
                          (decision) => (
                            <div
                              key={decision.ada}
                              className="flex flex-col bg-white border border-indigo-100 rounded-md p-2.5 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <a
                                  href={decision.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  {decision.ada}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {decision.issueDate.split(" ")[0]}
                                </span>
                              </div>
                              <p
                                className="text-xs text-gray-700 mt-1 line-clamp-2"
                                title={decision.subject}
                              >
                                {decision.subject}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Address */}
                {organization.diavgeia.address && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-indigo-600 font-semibold mb-2">
                      Διεύθυνση
                    </p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-900">
                        {[
                          organization.diavgeia.address.country,
                          organization.diavgeia.address.streetNumber,
                          organization.diavgeia.address.streetName,
                          organization.diavgeia.address.city,
                          organization.diavgeia.address.poBox,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {organization.diavgeia.fekNumber && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ΦΕΚ Σύστασης</p>
                      <p className="text-sm text-gray-900">
                        {getFekLabel(organization.diavgeia.fekType)}{" "}
                        {organization.diavgeia.fekNumber}/
                        {organization.diavgeia.fekYear}
                      </p>
                    </div>
                  </div>
                )}

                {/* Link to Diavgeia */}
                <div className="mt-3 pt-3 border-t border-indigo-200">
                  <a
                    href={`https://diavgeia.gov.gr/f/${organization.diavgeia.latinLabel}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Προβολή στη Διαύγεια
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {organization.mitos && organization.mitos.total > 0 && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-orange-500" />
                  Εθνικό Μητρώο Διαδικασιών
                </h3>
                <p className="text-sm text-gray-500">
                  Ψηφιακές και χειρόγραφες διαδικασίες που ανήκουν στον φορέα
                </p>
              </div>
              <a
                href={`https://mitos.gov.gr/index.php/%CE%95%CE%B9%CE%B4%CE%B9%CE%BA%CF%8C:EMDViewOrg?org=${organization.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-600 hover:underline flex items-center gap-1 font-medium"
              >
                Πηγή: mitos.gov.gr <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {!organization.mitos ? (
              <div className="py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-400">
                  Δεν βρέθηκαν διαθέσιμες διαδικασίες ή η φόρτωση εκκρεμεί.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {organization.mitos.procedures.map((proc) => (
                  <a
                    key={proc.id}
                    href={proc.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-all shadow-sm"
                  >
                    <div className="shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded flex items-center justify-center text-[10px] font-mono font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      {proc.id.slice(-4)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-orange-900">
                        {proc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 italic">
                          ID: {proc.id}
                        </span>
                        <ChevronRight className="h-3 w-3 text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Alternative Labels */}
      {organization.alternativeLabels &&
        organization.alternativeLabels.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Εναλλακτικές Ονομασίες
            </h3>
            <div className="flex flex-wrap gap-2">
              {organization.alternativeLabels.map((label, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* Contact Information */}
      <div className="grid md:grid-cols-2 gap-4">
        {organization.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <a
                href={`mailto:${organization.email}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {organization.email}
              </a>
            </div>
          </div>
        )}

        {organization.telephone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Τηλέφωνο</p>
              <a
                href={`tel:${organization.telephone}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {organization.telephone}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Address Info */}
      {address && address.fullAddress && (
        <div className="border-t border-gray-100 pt-6">
          <div className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent hover:border-red-100 hover:bg-red-50/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:text-red-600 transition-colors">
                <MapPin className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Έδρα Φορέα
                </p>
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {address.fullAddress}
                </p>
              </div>
            </div>

            {/* Google Maps Shortcut */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                address.fullAddress
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
              title="Άνοιγμα στους Χάρτες"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
      {/* Foundation Info */}
      {(fek || organization.foundationDate) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
          {fek && (
            <div className="group flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:text-blue-600 transition-colors">
                <FileText className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  ΦΕΚ Σύστασης
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {fek.issue} {fek.number}{" "}
                  <span className="text-gray-400 mx-0.5">/</span> {fek.year}
                </p>
              </div>
            </div>
          )}

          {organization.foundationDate && (
            <div className="group flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:text-emerald-600 transition-colors">
                <Calendar className="h-5 w-5 text-gray-400 group-hover:text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Ημερομηνία Σύστασης
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatDate(organization.foundationDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 px-6 py-3 border-t grid grid-cols-2 gap-4 text-[10px] text-gray-400">
        <p>
          Οριστικοποίηση:{" "}
          {formatDate(organization.organizationStructureUpdateDate)}
        </p>
        <p className="text-right">
          Ενημέρωση: {formatDate(organization.updateDate)}
        </p>
      </div>
    </div>
  );
}
