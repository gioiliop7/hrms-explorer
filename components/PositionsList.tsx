// components/UnitDetails.tsx
"use client";

import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Building2,
  ArrowRight,
} from "lucide-react";
import type { OrgmaMonadaDto } from "@/types/api";

interface UnitDetailsProps {
  unit: OrgmaMonadaDto;
  path?: Array<{ code: string; preferredLabel: string }>;
}

export default function UnitDetails({ unit, path }: UnitDetailsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
      {/* Breadcrumbs */}
      {path && path.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto pb-2">
          {path.map((item, idx) => (
            <div
              key={item.code}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {idx > 0 && <ArrowRight className="h-4 w-4 text-gray-400" />}
              <span
                className={
                  idx === path.length - 1 ? "font-semibold text-blue-600" : ""
                }
              >
                {item.preferredLabel}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">
            {unit.preferredLabel}
          </h3>
          <p className="text-sm text-gray-500 mt-1">Κωδικός: {unit.code}</p>
        </div>
      </div>

      {/* Alternative Labels */}
      {unit.alternativeLabels && unit.alternativeLabels.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Εναλλακτικές Ονομασίες
          </h4>
          <div className="flex flex-wrap gap-2">
            {unit.alternativeLabels.map((label, idx) => (
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

      {/* Description */}
      {unit.description && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Περιγραφή
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {unit.description}
          </p>
        </div>
      )}

      {/* Contact Information */}
      {(unit.email || unit.telephone || unit.url) && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Στοιχεία Επικοινωνίας
          </h4>
          <div className="space-y-3">
            {unit.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a
                  href={`mailto:${unit.email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {unit.email}
                </a>
              </div>
            )}

            {unit.telephone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a
                  href={`tel:${unit.telephone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {unit.telephone}
                </a>
              </div>
            )}

            {unit.url && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <a
                  href={unit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {unit.url}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address */}
      {unit.mainAddress && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Διεύθυνση
          </h4>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p>
                {unit.mainAddress.thoroughfare}{" "}
                {unit.mainAddress.locatorDesignator}
              </p>
              <p>
                {unit.mainAddress.postCode} {unit.mainAddress.postName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Addresses */}
      {unit.secondaryAddresses && unit.secondaryAddresses.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Επιπλέον Διευθύνσεις
          </h4>
          <div className="space-y-3">
            {unit.secondaryAddresses.map((address, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>
                    {address.thoroughfare} {address.locatorDesignator}
                  </p>
                  <p>
                    {address.postCode} {address.postName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Identifier */}
      {unit.identifier && (
        <div className="border-t pt-4 text-sm text-gray-500">
          <span className="font-medium">Αναγνωριστικό:</span> {unit.identifier}
        </div>
      )}
    </div>
  );
}
