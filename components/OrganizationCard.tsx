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
} from "lucide-react";
import type { FMitrooForeasDto } from "@/types/api";
import { ENTITY_TYPE_MAP, formatDate } from "@/lib/utils";

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

interface ExtendedOrganization extends FMitrooForeasDto {
  elstat?: {
    code: string;
    description: string;
    sheetName: string;
  } | null;
  gsis?: GsisData[] | null;
}

interface OrganizationCardProps {
  organization: ExtendedOrganization;
  onShowPositions: () => void;
}

export default function OrganizationCard({
  organization,
  onShowPositions,
}: OrganizationCardProps) {
  const address = organization.mainAddress;
  const fek = organization.foundationFek;
  console.log(organization)

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
      
      {organization.gsis && (
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

      {/* Address */}
      {address && (
        <div className="border-t pt-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Διεύθυνση</p>
              <p className="text-sm text-gray-900">
                {address.fullAddress ? address.fullAddress : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Foundation Info */}
      <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
        {fek && (
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">ΦΕΚ Σύστασης</p>
              <p className="text-sm text-gray-900">
                {fek.issue} {fek.number}/{fek.year}
              </p>
            </div>
          </div>
        )}

        {organization.foundationDate && (
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Ημερομηνία Σύστασης</p>
              <p className="text-sm text-gray-900">
                {formatDate(organization.foundationDate)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="grid md:grid-cols-2 gap-4 border-t pt-4 text-xs text-gray-500">
        {organization.organizationStructureUpdateDate && (
          <div>
            <span className="font-medium">Οριστικοποίηση Οργανογράμματος:</span>{" "}
            {formatDate(organization.organizationStructureUpdateDate)}
          </div>
        )}
        {organization.updateDate && (
          <div>
            <span className="font-medium">Τελευταία Ενημέρωση:</span>{" "}
            {formatDate(organization.updateDate)}
          </div>
        )}
      </div>
    </div>
  );
}
