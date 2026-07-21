"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import OrganizationCard from "@/components/OrganizationCard";
import TreeView from "@/components/TreeView";
import FlowDiagram from "@/components/FlowDiagram";
import UnitDetails from "@/components/UnitDetails";
import ViewToggle from "@/components/ViewToggle";
import PositionsPanel from "@/components/PositionsPanel";
import { CardSkeleton, TreeSkeleton } from "@/components/LoadingSkeleton";
import { orgUnitsAPI, organizationAPI } from "@/lib/api";
import type {
  FMitrooForeasDto,
  OrgmaMonadaTreeDto,
  OrgmaMonadaDto,
  OrgmaPathDto,
} from "@/types/api";
import FavoritesSidebar from "@/components/FavouritesSidebar";
import ComparisonView from "@/components/ComparisonView";
import FavoriteButton from "@/components/FavoriteButton";
import StatisticsCard from "@/components/StatisticsCard";
import { BarChart3, Loader2, Star } from "lucide-react";
import { useFavoritesContext } from "@/lib/FavoritesContext";
import { fetchDiavgeiaAction, fetchOpenGovAction } from "@/lib/actions";
import { useSearchParams } from "next/navigation";
import { ExtendedOrganization } from "@/types/frontend";
import ShareButton from "@/components/ShareButton";
import FullPageLoader from "@/components/FullPageLoader";

export default function HomeClient() {

  const [selectedOrganization, setSelectedOrganization] =
    useState<ExtendedOrganization | null>(null);
  const [organizationTree, setOrganizationTree] =
    useState<OrgmaMonadaTreeDto | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<OrgmaMonadaDto | null>(null);
  const [unitPath, setUnitPath] = useState<OrgmaPathDto | null>(null);
  const [view, setView] = useState<"tree" | "flow">("tree");

  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // New State for Diavgeia loading
  const [loadingDiavgeia, setLoadingDiavgeia] = useState(false);
  const [loadingOpenGov, setLoadingOpenGov] = useState(false);

  // New state for features
  const [showFavorites, setShowFavorites] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [allUnits, setAllUnits] = useState<OrgmaMonadaDto[]>([]);

  const handleUrlCheck = (code: string | null) => {
    if (code) {
      if (!selectedOrganization || selectedOrganization.code !== code) {
        setIsInitialLoading(true);
        handleSelectByCode(code).finally(() => {
          setIsInitialLoading(false);
        });
      } else {
        setIsInitialLoading(false);
      }
    } else {
      setIsInitialLoading(false);
    }
  };

  const { addToRecent } = useFavoritesContext();

  // Ref to scroll to positions panel
  const positionsPanelRef = useRef<HTMLDivElement>(null);

  const [loadingMitos, setLoadingMitos] = useState(false);

  const handleOrganizationSelect = async (org: FMitrooForeasDto) => {
    const url = new URL(window.location.href);
    url.searchParams.set("org", org.code);
    window.history.pushState({}, "", url);

    const initialOrgState: ExtendedOrganization = {
      ...org,
      diavgeia: null,
      mitos: null,
      opengov: null,
    };

    setSelectedOrganization(initialOrgState);

    setSelectedUnit(null);
    setUnitPath(null);

    addToRecent(org);

    loadOrganizationTree(org.code);

    setLoadingDiavgeia(true);
    try {
      const diavgeiaData = await fetchDiavgeiaAction(org.preferredLabel);

      if (diavgeiaData) {
        setSelectedOrganization((prev) => {
          if (!prev || prev.code !== org.code) return prev;

          return {
            ...prev,
            diavgeia: diavgeiaData,
          };
        });
      }
    } catch (err) {
      console.error("Error fetching Diavgeia data:", err);
    } finally {
      setLoadingDiavgeia(false);
    }

    setLoadingOpenGov(true);
    try {
      const opengovData = await fetchOpenGovAction(org.preferredLabel);

      setSelectedOrganization((prev) => {
        if (!prev || prev.code !== org.code) return prev;

        return {
          ...prev,
          opengov: opengovData,
        };
      });
    } catch (err) {
      console.error("Error fetching OpenGov data:", err);
    } finally {
      setLoadingOpenGov(false);
    }

    setLoadingMitos(true);
    try {
      const response = await fetch(`/api/organizations/${org.code}`);
      if (response.ok) {
        const fullData = await response.json();

        setSelectedOrganization((prev) => {
          if (!prev || prev.code !== org.code) return prev;
          return {
            ...prev,
            elstat: fullData.data.elstat,
            gsis: fullData.data.gsis,
            mitos: fullData.data.mitos,
          };
        });
      }
    } catch (err) {
      console.error("Error fetching Mitos/Registry data:", err);
    } finally {
      setLoadingMitos(false);
    }
  };

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

  const handleSelectByCode = async (code: string) => {
    try {
      const response = await organizationAPI.getByCode(code);
      const org = response.data.data;

      const initialOrgState: ExtendedOrganization = {
        ...org,
        diavgeia: null,
        mitos: null,
        opengov: null,
      };
      setSelectedOrganization(initialOrgState);
      setSelectedUnit(null);
      setUnitPath(null);
      addToRecent(org);
      loadOrganizationTree(org.code);

      // Diavgeia Fetch (Simplified call)
      setLoadingDiavgeia(true);
      fetchDiavgeiaAction(org.preferredLabel).then((data) => {
        if (data)
          setSelectedOrganization((prev) =>
            prev && prev.code === org.code ? { ...prev, diavgeia: data } : prev
          );
        setLoadingDiavgeia(false);
      });

      // OpenGov Consultations Fetch (Simplified call)
      setLoadingOpenGov(true);
      fetchOpenGovAction(org.preferredLabel).then((data) => {
        setSelectedOrganization((prev) =>
          prev && prev.code === org.code ? { ...prev, opengov: data } : prev
        );
        setLoadingOpenGov(false);
      });

      // Mitos Fetch (Simplified call)
      setLoadingMitos(true);
      fetch(`/api/organizations/${org.code}`)
        .then((res) => res.json())
        .then((data) => {
          setSelectedOrganization((prev) =>
            prev && prev.code === org.code
              ? {
                  ...prev,
                  elstat: data.data.elstat,
                  gsis: data.data.gsis,
                  mitos: data.data.mitos,
                }
              : prev
          );
          setLoadingMitos(false);
        });
    } catch (error) {
      console.error("Error loading organization:", error);
      setError("Σφάλμα κατά τη φόρτωση του φορέα");
    }
  };

  const handleSelectUnit = async (unitCode: string) => {
    setLoadingUnit(true);
    setError(null);

    if (!selectedOrganization) return;

    try {
      const unitsResponse = await orgUnitsAPI.getUnits(
        selectedOrganization.code
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

  // Function to scroll to positions
  const scrollToPositions = () => {
    if (positionsPanelRef.current) {
      positionsPanelRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle "View Organization Positions" button click
  const handleViewOrgPositions = () => {
    // Deselect unit to show organization-wide positions
    setSelectedUnit(null);
    // Use setTimeout to allow state update before scrolling
    setTimeout(scrollToPositions, 100);
  };

  // Handle "View Unit Positions" button click
  const handleViewUnitPositions = () => {
    // Unit is already selected, just scroll
    scrollToPositions();
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
    <>
      <Suspense fallback={<FullPageLoader />}>
        <UrlHandler onCheckUrl={handleUrlCheck} />
      </Suspense>
      {isInitialLoading ? (
        <FullPageLoader />
      ) : (
        <main>
          <div className="container mx-auto px-4 flex-1 flex flex-col max-w-7xl">
            {/* Top Controls: Search and Action Buttons */}
            <TopControls
              setShowFavorites={setShowFavorites}
              setShowStatistics={setShowStatistics}
              setShowComparison={setShowComparison}
              showStatistics={showStatistics}
              selectedOrganization={selectedOrganization}
              onSelectOrganization={handleOrganizationSelect}
              onSelectByCode={handleSelectByCode}
            />

            {/* Empty State */}
            {!selectedOrganization && <WelcomeMessage />}

            {/* Main Content Container */}
            <div className="flex-grow py-10 space-y-8">
              {/* Error Message */}
              {error && <ErrorMessage message={error} />}

              {/* Statistics Dashboard */}
              {selectedOrganization &&
                showStatistics &&
                allUnits.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Στατιστικά & Αναλύσεις
                    </h2>
                    <StatisticsCard units={allUnits} />
                  </div>
                )}

              {/* Organization Details */}
              {selectedOrganization && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900">
                        Στοιχεία Φορέα
                      </h2>
                      {loadingDiavgeia && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Διαύγεια...</span>
                        </div>
                      )}
                      {loadingMitos && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Μίτος & Μητρώα...</span>
                        </div>
                      )}
                      {loadingOpenGov && (
                        <div className="flex items-center gap-1 text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-full animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>OpenGov...</span>
                        </div>
                      )}
                    </div>
                    <FavoriteButton
                      organization={selectedOrganization}
                      showLabel
                    />
                  </div>
                  <OrganizationCard
                    organization={selectedOrganization}
                    onShowPositions={handleViewOrgPositions}
                  />
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
                          <div className="w-full overflow-x-auto">
                            <UnitDetails
                              unit={selectedUnit}
                              path={getPathArray(unitPath)}
                              onShowPositions={handleViewUnitPositions}
                            />
                          </div>
                        ) : (
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

              {/* Positions Panel */}
              {selectedOrganization && (
                <div className="space-y-4" ref={positionsPanelRef}>
                  <h2 className="text-2xl font-bold text-[#1b3d89]">
                    Θέσεις Εργασίας
                  </h2>
                  <PositionsPanel
                    key={`${selectedOrganization.code}-${
                      selectedUnit?.code || "all"
                    }`}
                    organizationCode={selectedOrganization.code}
                    unitCode={selectedUnit?.code}
                    unitName={selectedUnit?.preferredLabel}
                  />
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
      )}
    </>
  );
}

// Separate component for Welcome Message
function WelcomeMessage() {
  return (
    <div className="mt-6 p-12 bg-white border border-gray-200 shadow-sm rounded-sm text-center">
      <h3 className="text-2xl font-bold text-[#1b3d89] mb-4">
        Καλώς ήρθατε στο The Greek Extended Registry
      </h3>
      <p className="text-gray-600 max-w-xl mx-auto text-lg leading-relaxed">
        Αναζητήστε έναν φορέα του Δημοσίου παραπάνω για να εξερευνήσετε το
        επίσημο οργανόγραμμα, τις θέσεις εργασίας του αλλα και πολλαπλές άλλες
        πληροφορίες μέσω απο διάφορα μητρώα του Δημοσίου
      </p>
    </div>
  );
}

// Separate component for Error Message
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-700 p-4">
      <div className="flex">
        <div>
          <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
            Σφάλμα
          </h3>
          <p className="text-sm text-red-800 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Separate component for Top Controls
function TopControls({
  setShowFavorites,
  setShowStatistics,
  setShowComparison,
  showStatistics,
  selectedOrganization,
  onSelectOrganization,
  onSelectByCode,
}: {
  setShowFavorites: (v: boolean) => void;
  setShowStatistics: (v: boolean) => void;
  setShowComparison: (v: boolean) => void;
  showStatistics: boolean;
  selectedOrganization: FMitrooForeasDto | null;
  onSelectOrganization: (org: FMitrooForeasDto) => void;
  onSelectByCode: (code: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-4 w-full">
      {/* Search Section */}
      <div className="w-full">
        <Suspense fallback={<div>Loading...</div>}>
          <SearchBar onSelectOrganization={onSelectOrganization} onSelectByCode={onSelectByCode} />
        </Suspense>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full justify-end">
        {/* Favorites Button */}
        <button
          onClick={() => setShowFavorites(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
        >
          <Star className="h-5 w-5" />
          <span className="hidden sm:inline">Αγαπημένα</span>
        </button>

        {selectedOrganization && (
          <>
            <ShareButton organization={selectedOrganization} />
            {/* Statistics Button */}
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className={`flex items-center gap-2 px-4 py-2 text-purple-700 ${
                showStatistics ? "bg-purple-200" : "bg-purple-100"
              } rounded-lg hover:bg-purple-200 transition-colors`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Στατιστικά</span>
            </button>

            {/* Comparison Button */}
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
    </div>
  );
}

function UrlHandler({
  onCheckUrl,
}: {
  onCheckUrl: (code: string | null) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("org");
    onCheckUrl(code);
  }, [searchParams, onCheckUrl]);

  return null;
}
