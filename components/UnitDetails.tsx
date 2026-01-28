"use client";

import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Building2,
  ArrowRight,
  Briefcase, // Import Briefcase icon
} from "lucide-react";
import type { OrgmaMonadaDto } from "@/types/api";

interface UnitDetailsProps {
  unit: OrgmaMonadaDto;
  path?: Array<{ code: string; preferredLabel: string }>;
  onShowPositions: () => void; // New prop callback
}

export default function UnitDetails({
  unit,
  path,
  onShowPositions,
}: UnitDetailsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
      {/* Breadcrumbs */}
      {path && path.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto pb-2 scrollbar-thin">
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
      <div className="flex items-start gap-4 flex-col sm:flex-row">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                {unit.preferredLabel}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Κωδικός: {unit.code}</p>
            </div>

            {/* View Positions Button */}
            <button
              onClick={onShowPositions}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors font-medium text-sm whitespace-nowrap shrink-0"
            >
              <Briefcase className="h-4 w-4" />
              <span>Θέσεις Μονάδας</span>
            </button>
          </div>
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
                  className="text-sm text-blue-600 hover:underline break-all"
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
                  className="text-sm text-blue-600 hover:underline break-all"
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
              <p>{unit.mainAddress.fullAddress}</p>
            </div>
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
