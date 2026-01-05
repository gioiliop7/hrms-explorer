"use client";

import { useState, useEffect } from "react";
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
  OrgmaPathDto,
} from "@/types/api";
import { Suspense } from "react";

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
    <main className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* --- GOV.GR HEADER --- */}
      <header className="govgr-header" role="banner">
        <div className="govgr-header__content">
          <img className="max-w-25 w-full" src="/logo.png" alt="logo" />
          <a className="govgr-header__title hover:underline" href="/">
            ΣΔΑΔ Explorer
          </a>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Search Section */}
        <div className="w-full">
          <Suspense fallback={<div>Loading...</div>}>
            <SearchBar onSelectOrganization={setSelectedOrganization} />
          </Suspense>
        </div>

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
          <OrganizationCard organization={selectedOrganization} />
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

      {/* --- GOV.GR FOOTER --- */}
      <footer className="govgr-footer">
        <div className="govgr-width-container">
          <div className="govgr-footer__meta">
            <div className="govgr-footer__meta-item govgr-footer__meta-item--grow">
              <div className="govgr-footer__content">
                <p className="govgr-footer__licence-description">
                  © Copyright 2026 - Υλοποίηση από{" "}
                  <a
                    href="https://gioiliop.eu"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="govgr-link"
                  >
                    Giorgos Iliopoulos
                    <span className="sr-only">
                      (ανοίγει σε καινούρια καρτέλα)
                    </span>
                  </a>
                  <br />
                  <span className="text-sm text-gray-500 mt-2 block">
                    Δεδομένα από το Σύστημα Διαχείρισης Ανθρώπινου Δυναμικού
                    (ΣΔΑΔ)
                  </span>
                </p>
                <p className="italic text-sm text-gray-500 mt-2">
                  *Η σελίδα αποτελεί προσωπικό project και δεν είναι επίσημη
                  πλατφόρμα του gov.gr
                </p>
              </div>
            </div>
            <div className="govgr-footer__meta-item">
              <p>Inspired by gov.gr look and feel</p>
              <a
                href="https://guide.services.gov.gr/"
                target="_blank"
                rel="noreferrer noopener"
                className="govgr-link"
              >
                Δείτε περισσότερα εδώ
                <span className="sr-only">(ανοίγει σε καινούρια καρτέλα)</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
