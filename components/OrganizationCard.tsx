"use client";

import {
  Building2,
  MapPin,
  FileText,
  Calendar,
  Mail,
  Phone,
  Briefcase, // Import Briefcase icon
} from "lucide-react";
import type { FMitrooForeasDto } from "@/types/api";
import { ENTITY_TYPE_MAP, formatDate } from "@/lib/utils";

interface OrganizationCardProps {
  organization: FMitrooForeasDto;
  onShowPositions: () => void; // New prop callback
}

export default function OrganizationCard({
  organization,
  onShowPositions,
}: OrganizationCardProps) {
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
