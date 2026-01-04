// components/OrganizationCard.tsx
"use client";

import {
  Building2,
  MapPin,
  FileText,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import type { FMitrooForeasDto } from "@/types/api";
import { formatDate } from "@/lib/utils";

interface OrganizationCardProps {
  organization: FMitrooForeasDto;
}

export default function OrganizationCard({
  organization,
}: OrganizationCardProps) {
  const address = organization.mainAddress;
  const fek = organization.foundationFek;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {organization.preferredLabel}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Κωδικός: {organization.code}
          </p>
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

      {/* Address */}
      {address && (
        <div className="border-t pt-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-1">Διεύθυνση</p>
              <p className="text-sm text-gray-900">
                {address.thoroughfare} {address.locatorDesignator}
              </p>
              <p className="text-sm text-gray-600">
                {address.postCode} {address.postName}
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
