"use client";

import { useState, useEffect, use } from "react";
import SearchBar from "@/components/SearchBar";
import OrganizationCard from "@/components/OrganizationCard";
import TreeView from "@/components/TreeView";
import FlowDiagram from "@/components/FlowDiagram";
import UnitDetails from "@/components/UnitDetails";
import ViewToggle from "@/components/ViewToggle";
import { CardSkeleton, TreeSkeleton } from "@/components/LoadingSkeleton";
import { orgUnitsAPI, organizationAPI } from "@/lib/api";
import type {
  FMitrooForeasDto,
  OrgmaMonadaTreeDto,
  OrgmaMonadaDto,
  OrgmaPathDto,
} from "@/types/api";
import { Suspense } from "react";
import FavoritesSidebar from "@/components/FavouritesSidebar";
import ComparisonView from "@/components/ComparisonView";
import FavoriteButton from "@/components/FavoriteButton";
import StatisticsCard from "@/components/StatisticsCard";
import { BarChart3, Star } from "lucide-react";
import { useFavoritesContext } from "@/lib/FavoritesContext";

export default function Home() {
  const [selectedOrganization, setSelectedOrganization] =
    useState<FMitrooForeasDto | null>(null);
  const [organizationTree, setOrganizationTree] =
    useState<OrgmaMonadaTreeDto | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrgmaMonadaDto | null>(null);
  const [unitPath, setUnitPath] = useState<OrgmaPathDto | null>(null);
  const [view, setView] = useState<"tree" | "flow">("tree");

  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for features
  const [showFavorites, setShowFavorites] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [allUnits, setAllUnits] = useState<OrgmaMonadaDto[]>([]);

  const { addToRecent } = useFavoritesContext();

  // Load organization tree when organization is selected
  useEffect(() => {
    if (selectedOrganization) {
      loadOrganizationTree(selectedOrganization.code);
      addToRecent(selectedOrganization);
    }
  }, [selectedOrganization]);

  const loadOrganizationTree = async (organizationCode: string) => {
    setLoadingTree(true);
    setError(null);
    try {
      const [treeResponse, unitsResponse] = await Promise.all([
        orgUnitsAPI.getTree(organizationCode),
        orgUnitsAPI.getUnits(organizationCode),
      ]);
      setOrganizationTree(treeResponse.data.data);
      setAllUnits(unitsResponse.data.data || []);
    } catch (err) {
      console.error("Error loading tree:", err);
      setError("Σφάλμα κατά τη φόρτωση του οργανογράμματος");
    } finally {
      setLoadingTree(false);
    }
  };

  // Handle selecting organization by code (from favorites)
  const handleSelectByCode = async (code: string) => {
    try {
      const response = await organizationAPI.getByCode(code);
      setSelectedOrganization(response.data.data);
    } catch (error) {
      console.error("Error loading organization:", error);
      setError("Σφάλμα κατά τη φόρτωση του φορέα");
    }
  };

  const handleSelectUnit = async (unitCode: string) => {
    setLoadingUnit(true);
    setError(null);

    try {
      // Load unit details
      const unitsResponse = await orgUnitsAPI.getUnits(
        selectedOrganization!.code
      );
      const unit = unitsResponse.data.data.find((u) => u.code === unitCode);

      if (unit) {
        setSelectedUnit(unit);
      }

      // Load unit path (breadcrumbs)
      try {
        const pathResponse = await orgUnitsAPI.getPath(unitCode);
        setUnitPath(pathResponse.data.data);
      } catch (err) {
        console.warn("Could not load unit path:", err);
      }
    } catch (err) {
      console.error("Error loading unit details:", err);
      setError("Σφάλμα κατά τη φόρτωση των στοιχείων της μονάδας");
    } finally {
      setLoadingUnit(false);
    }
  };

  // Convert path to array for breadcrumbs
  const getPathArray = (
    path: OrgmaPathDto | null
  ): Array<{ code: string; preferredLabel: string }> => {
    if (!path) return [];
    const result: Array<{ code: string; preferredLabel: string }> = [];
    let current: OrgmaPathDto | undefined = path;
    while (current) {
      result.push({
        code: current.code,
        preferredLabel: current.preferredLabel,
      });
      current = current.child;
    }
    return result;
  };

  return (
    <main>
      <div className="container mx-auto px-4 flex-1 flex flex-col max-w-7xl">

        {/* Top Controls: Search and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-4 w-full">
          {/* Search Section */}
          <div className="w-full">
            <Suspense fallback={<div>Loading...</div>}>
              <SearchBar onSelectOrganization={setSelectedOrganization} />
            </Suspense>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full justify-end">
            <button
              onClick={() => setShowFavorites(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <Star className="h-5 w-5" />
              <span className="hidden sm:inline">Αγαπημένα</span>
            </button>

            {selectedOrganization && (
              <>
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="hidden sm:inline">Στατιστικά</span>
                </button>

                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="hidden sm:inline">Σύγκριση</span>
                </button>
              </>
            )}
          </div>

          {/* Statistics Dashboard */}
          {selectedOrganization && showStatistics && allUnits.length > 0 && (
            <div className="space-y-4 w-full mx-auto flex justify-center flex-col max-w-[60%]">
              <h2 className="text-xl font-bold text-gray-900">
                Στατιστικά & Αναλύσεις
              </h2>
              <StatisticsCard units={allUnits} />
            </div>
          )}
        </div>

        

        {/* Main Content Container */}
        <div className="flex-grow py-10 space-y-8">

          {/* Error Message - Text Only / No Icon */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-700 p-4">
              <div className="flex">
                <div>
                  <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                    Σφάλμα
                  </h3>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Organization Details */}
          {selectedOrganization && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Στοιχεία Φορέα
                </h2>
                <FavoriteButton organization={selectedOrganization} showLabel />
              </div>
              <OrganizationCard organization={selectedOrganization} />
            </div>
          )}

          {/* Tree/Flow View */}
          {selectedOrganization && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 gap-4">
                <h2 className="text-2xl font-bold text-[#1b3d89]">
                  Οργανωτική Δομή
                </h2>
                <ViewToggle view={view} onViewChange={setView} />
              </div>

              {loadingTree ? (
                <TreeSkeleton />
              ) : organizationTree ? (
                <div className="grid lg:grid-cols-1 gap-8">
                  <div className="bg-white p-4 sm:p-6 rounded-sm border border-gray-200 shadow-sm w-full overflow-x-auto">
                    <div className="min-w-max">
                      {" "}
                      {view === "tree" ? (
                        <TreeView
                          tree={organizationTree}
                          onSelectUnit={handleSelectUnit}
                          selectedUnitCode={selectedUnit?.code}
                        />
                      ) : (
                        <FlowDiagram
                          tree={organizationTree}
                          onSelectUnit={handleSelectUnit}
                        />
                      )}
                    </div>
                  </div>

                  {/* Unit Details Panel */}
                  <div className="space-y-6 w-full min-w-0">
                    {loadingUnit ? (
                      <CardSkeleton />
                    ) : selectedUnit ? (
                      /* Προσθήκη wrapper με overflow-x-auto για να μην σπάει η σελίδα αν έχει πίνακες */
                      <div className="w-full overflow-x-auto">
                        <UnitDetails
                          unit={selectedUnit}
                          path={getPathArray(unitPath)}
                        />
                      </div>
                    ) : (
                      /* Responsive padding: p-6 στα κινητά, p-12 σε μεγάλες οθόνες */
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-sm p-6 sm:p-12 text-center h-full flex flex-col justify-center items-center">
                        <p className="text-gray-500 text-lg font-medium break-words max-w-md mx-auto">
                          Επιλέξτε μια μονάδα από το διάγραμμα για να δείτε
                          αναλυτικές πληροφορίες
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Empty State - Text Only / No Icon */}
          {!selectedOrganization && (
            <div className="mt-12 p-12 bg-white border border-gray-200 shadow-sm rounded-sm text-center">
              <h3 className="text-2xl font-bold text-[#1b3d89] mb-4">
                Καλώς ήρθατε στον ΣΔΑΔ Explorer
              </h3>
              <p className="text-gray-600 max-w-xl mx-auto text-lg leading-relaxed">
                Αναζητήστε έναν φορέα του Δημοσίου παραπάνω για να εξερευνήσετε το
                επίσημο οργανόγραμμα και τις θέσεις εργασίας του.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Favorites Sidebar */}
      <FavoritesSidebar
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onSelectOrganization={handleSelectByCode}
      />

      {/* Comparison View Modal */}
      {showComparison && (
        <ComparisonView
          initialOrganization={selectedOrganization || undefined}
          onClose={() => setShowComparison(false)}
        />
      )}
    </main>
  );
}
