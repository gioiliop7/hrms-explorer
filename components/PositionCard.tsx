// components/PositionCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Briefcase, FileText, X, Download, Loader2 } from "lucide-react";
import type { OrgmaThesiDto } from "@/types/api";
import { positionsAPI } from "@/lib/api";
import {
  getEmployeeCategoryDescription,
  getEmploymentTypeDescription,
  getRankDescription,
} from "@/lib/utils";

import { getDescriptionById } from "@/lib/actions";

interface PositionCardProps {
  position: OrgmaThesiDto;
}

export default function PositionCard({ position }: PositionCardProps) {
  const [showPDF, setShowPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [professionDesc, setProfessionDesc] = useState<string>("-");
  const [specialityDesc, setSpecialityDesc] = useState<string>("-");

  const handleViewPDF = async () => {
    if (pdfUrl) {
      setShowPDF(true);
      return;
    }

    setLoadingPDF(true);
    try {
      const response = await positionsAPI.getJobDescriptionPDF(position.code);
      const url = URL.createObjectURL(response.data);
      setPdfUrl(url);
      setShowPDF(true);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Σφάλμα κατά τη φόρτωση του PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await positionsAPI.getJobDescriptionPDF(position.code);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ΕΠΘ_${position.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Σφάλμα κατά τη λήψη του PDF");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (position.professionCategory) {
        const desc = await getDescriptionById(position.professionCategory);
        if (desc) setProfessionDesc(desc);
      }

      if (position.speciality) {
        const desc = await getDescriptionById(position.speciality);
        if (desc) setSpecialityDesc(desc);
      }
    };

    fetchData();
  }, [position.professionCategory, position.speciality]);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm md:text-base break-words">
                {position.jobDescriptionTitle || "Θέση Εργασίας"}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Κωδικός: {position.code}
              </p>
            </div>
          </div>

          {/* Type Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              position.type === "Organic"
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {position.type === "Organic" ? "Οργανική" : "Προσωποπαγής"}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          {position.employmentType !== undefined && (
            <DetailRow
              label="Εργασιακή Σχέση"
              value={getEmploymentTypeDescription(position.employmentType)}
            />
          )}
          {position.employeeCategory !== undefined && (
            <DetailRow
              label="Κατηγορία"
              value={getEmployeeCategoryDescription(position.employeeCategory)}
            />
          )}
          {position.educationCategory !== undefined && (
            <DetailRow
              label="Εκπαίδευση"
              value={getEducationLabel(position.educationCategory)}
            />
          )}
          {position.professionCategory !== undefined && (
            <DetailRow label="Κλάδος" value={professionDesc} />
          )}

          {position.speciality !== undefined && (
            <DetailRow label="Ειδικότητα" value={specialityDesc} />
          )}
          {position.rank !== undefined && (
            <DetailRow
              label="Βαθμός"
              value={getRankDescription(position.rank)}
            />
          )}
          {position.inProsontologio !== undefined && (
            <DetailRow
              label="Προσοντολόγιο"
              value={position.inProsontologio ? "Ναι" : "Όχι"}
            />
          )}
        </div>

        {/* Version Info */}
        {position.jobDescriptionVersionDate && (
          <div className="text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
            Έκδοση ΕΠΘ: {position.jobDescriptionVersion} •{" "}
            {position.jobDescriptionVersionDate}
          </div>
        )}

        {/* Action Buttons */}
        {position.jobDescriptionCode && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleViewPDF}
              disabled={loadingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-lg hover:bg-gov-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loadingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Φόρτωση...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Προβολή ΕΠΘ</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Λήψη PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {showPDF && pdfUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-lg">
                Ειδικό Περίγραμμα Θέσης (ΕΠΘ)
              </h3>
              <button
                onClick={() => setShowPDF(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="Job Description PDF"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Λήψη PDF</span>
              </button>
              <button
                onClick={() => setShowPDF(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper Components
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <span className="text-gray-500">{label}:</span>{" "}
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}

// Helper function for education labels
function getEducationLabel(category: number): string {
  const labels: Record<number, string> = {
    1: "ΠΕ (Πανεπιστημιακή)",
    2: "ΤΕ (Τεχνολογική)",
    3: "ΔΕ (Δευτεροβάθμια)",
    4: "ΥΕ (Υποχρεωτική)",
  };
  return labels[category] || `Κατηγορία ${category}`;
}
