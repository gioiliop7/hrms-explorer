// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Building2, AlertCircle } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import OrganizationCard from "@/components/OrganizationCard";
import TreeView from "@/components/TreeView";
import FlowDiagram from "@/components/FlowDiagram";
import UnitDetails from "@/components/UnitDetails";
import ViewToggle from "@/components/ViewToggle";
import { CardSkeleton, TreeSkeleton } from "@/components/LoadingSkeleton";
import { orgUnitsAPI } from "@/lib/api";
import type {
  FMitrooForeasDto,
  OrgmaMonadaTreeDto,
  OrgmaMonadaDto,
  OrgmaThesiDto,
  OrgmaPathDto,
} from "@/types/api";

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

  // Load organization tree when organization is selected
  useEffect(() => {
    if (selectedOrganization) {
      loadOrganizationTree(selectedOrganization.code);
    }
  }, [selectedOrganization]);

  const loadOrganizationTree = async (organizationCode: string) => {
    setLoadingTree(true);
    setError(null);
    try {
      const response = await orgUnitsAPI.getTree(organizationCode);
      setOrganizationTree(response.data.data);
    } catch (err) {
      console.error("Error loading tree:", err);
      setError("Σφάλμα κατά τη φόρτωση του οργανογράμματος");
    } finally {
      setLoadingTree(false);
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
    <main className="min-h-screen from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ΣΔΑΔ Explorer
              </h1>
              <p className="text-sm text-gray-600">
                Εξερευνητής Οργανογραμμάτων & Θέσεων
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search Section */}
        <div className="flex justify-center">
          <SearchBar onSelectOrganization={setSelectedOrganization} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Σφάλμα</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Organization Details */}
        {selectedOrganization && (
          <OrganizationCard organization={selectedOrganization} />
        )}

        {/* Tree/Flow View */}
        {selectedOrganization && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Οργανωτική Δομή
              </h2>
              <ViewToggle view={view} onViewChange={setView} />
            </div>

            {loadingTree ? (
              <TreeSkeleton />
            ) : organizationTree ? (
              <div className="grid lg:grid-cols-1 gap-6">
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

                {/* Unit Details Panel */}
                <div className="space-y-6">
                  {loadingUnit ? (
                    <CardSkeleton />
                  ) : selectedUnit ? (
                    <UnitDetails
                      unit={selectedUnit}
                      path={getPathArray(unitPath)}
                    />
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Επιλέξτε μια μονάδα για να δείτε λεπτομέρειες</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Empty State */}
        {!selectedOrganization && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Καλώς ήρθατε στον ΣΔΑΔ Explorer
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Αναζητήστε έναν φορέα για να εξερευνήσετε το οργανόγραμμα και τις
              θέσεις εργασίας του
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Δεδομένα από το Σύστημα Διαχείρισης Ανθρώπινου Δυναμικού (ΣΔΑΔ)
          </p>
        </div>
      </footer>
    </main>
  );
}
