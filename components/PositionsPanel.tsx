// components/PositionsPanel.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Briefcase,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";
import type { OrgmaThesiDto, OrgmaThesiStatus } from "@/types/api";
import { positionsAPI } from "@/lib/api";
import { getPositionStatusLabel, POSITION_STATUS_ORDER } from "@/lib/utils";
import PositionCard from "./PositionCard";

interface PositionsPanelProps {
  organizationCode: string;
  unitCode?: string;
  unitName?: string;
}

const ITEMS_PER_PAGE = 9; // Εμφάνιση 9 καρτών ανά σελίδα (ταιριάζει σε grid 3 στηλών)

export default function PositionsPanel({
  organizationCode,
  unitCode,
  unitName,
}: PositionsPanelProps) {
  const [positions, setPositions] = useState<OrgmaThesiDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // States για Pagination και Αναζήτηση
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrgmaThesiStatus | "">("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleFetchPositions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await positionsAPI.getPositions(
        unitCode ? undefined : organizationCode,
        unitCode
      );

      setPositions(response.data.data || []);
      setFetched(true);
      setIsExpanded(true);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching positions:", err);
      setError("Σφάλμα κατά τη φόρτωση των θέσεων");
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = useMemo(() => {
    let result = positions;

    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((p) => {
        // Safely handle nulls and convert non-strings (like numbers) to string
        const code = (p.code || "").toString().toLowerCase();
        const type = (p.employmentType || "").toString().toLowerCase();
        const title = (p.jobDescriptionTitle || "").toString().toLowerCase();

        return code.includes(lowerTerm) || type.includes(lowerTerm) || title.includes(lowerTerm);
      });
    }

    return result;
  }, [positions, searchTerm, statusFilter]);

  // 2. Υπολογισμός Pagination
  const totalPages = Math.ceil(filteredPositions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPositions = filteredPositions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Statistics
  const organicCount = positions.filter((p) => p.type === "Organic").length;
  const temporaryCount = positions.filter((p) => p.type === "Temporary").length;

  const statusCounts = positions.reduce((acc, pos) => {
    if (pos.status) acc[pos.status] = (acc[pos.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const availableStatuses = POSITION_STATUS_ORDER.filter(
    (status) => statusCounts[status] > 0
  );

  const positionsByEducation = positions.reduce((acc, pos) => {
    const edu = pos.educationCategory || 0;
    acc[edu] = (acc[edu] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-4">
      {/* Header with Fetch Button */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Θέσεις Εργασίας
              </h3>
              {unitName && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Μονάδα: {unitName}
                </p>
              )}
              {fetched && (
                <p className="text-xs text-gray-400 mt-1">
                  {positions.length} συνολικά
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleFetchPositions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Φόρτωση...</span>
              </>
            ) : (
              <>
                <Briefcase className="h-4 w-4" />
                <span>{fetched ? "Ανανέωση" : "Φόρτωση"}</span>
              </>
            )}
          </button>
        </div>

        {/* Statistics Summary - Πιο compact */}
        {fetched && positions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Σύνολο" value={positions.length} color="blue" />
              <StatCard label="Οργανικές" value={organicCount} color="green" />
              <StatCard
                label="Προσωποπαγείς"
                value={temporaryCount}
                color="orange"
              />
              <StatCard
                label="Κατηγορίες"
                value={Object.keys(positionsByEducation).length}
                color="purple"
              />
            </div>

            {availableStatuses.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {availableStatuses.map((status) => (
                  <StatCard
                    key={status}
                    label={getPositionStatusLabel(status)}
                    value={statusCounts[status] || 0}
                    color={STATUS_STAT_COLOR[status]}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-700 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-700 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                Σφάλμα
              </h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {fetched && positions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Toolbar: Search & Collapse */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between sticky top-0 z-10">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Αναζήτηση με κωδικό ή τίτλο"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition duration-150 ease-in-out"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset page on search
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <FilterX className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            {availableStatuses.length > 0 && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OrgmaThesiStatus | "");
                  setCurrentPage(1); // Reset page on filter change
                }}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Όλες οι καταστάσεις</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getPositionStatusLabel(status)} ({statusCounts[status]})
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline-block">
                {filteredPositions.length} αποτελέσματα
              </span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Grid Content */}
          {isExpanded && (
            <>
              {filteredPositions.length > 0 ? (
                <div className="p-4">
                  {/* Grid Layout: 1 col mobile, 2 col tablet, 3 col desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {currentPositions.map((position) => (
                      <div key={position.code} className="h-full">
                        <PositionCard position={position} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FilterX className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>
                    {searchTerm
                      ? `Δεν βρέθηκαν αποτελέσματα για "${searchTerm}"`
                      : "Δεν βρέθηκαν θέσεις με αυτά τα κριτήρια"}
                  </p>
                </div>
              )}

              {/* Pagination Controls */}
              {filteredPositions.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Προηγ.
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Επόμ.
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Εμφάνιση{" "}
                        <span className="font-medium">{startIndex + 1}</span>{" "}
                        έως{" "}
                        <span className="font-medium">
                          {Math.min(
                            startIndex + ITEMS_PER_PAGE,
                            filteredPositions.length
                          )}
                        </span>{" "}
                        από{" "}
                        <span className="font-medium">
                          {filteredPositions.length}
                        </span>{" "}
                        θέσεις
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Απλός δείκτης σελίδας */}
                        <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Σελίδα {currentPage} από {totalPages}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {fetched && positions.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium">Δεν βρέθηκαν θέσεις</p>
        </div>
      )}
    </div>
  );
}

type StatCardColor =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "slate"
  | "amber"
  | "indigo"
  | "red";

// Maps each position status to the color its stat card / would use
const STATUS_STAT_COLOR: Record<string, StatCardColor> = {
  Occupied: "slate",
  Empty: "amber",
  Reserved: "indigo",
  ToBeAbolished: "red",
};

// Helper component for stat cards (Slightly smaller text)
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: StatCardColor;
}) {
  const colorClasses: Record<StatCardColor, string> = {
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    green: "bg-green-50 text-green-700 ring-1 ring-green-100",
    orange: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
    purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
    slate: "bg-slate-50 text-slate-700 ring-1 ring-slate-100",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
    red: "bg-red-50 text-red-700 ring-1 ring-red-100",
  };

  return (
    <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-80 mt-0.5">{label}</div>
    </div>
  );
}
