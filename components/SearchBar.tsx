// components/SearchBar.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { organizationAPI } from "@/lib/api";
import { debounce } from "@/lib/utils";
import type { FMitrooForeasDto } from "@/types/api";
import { useSearchParams } from "next/navigation";

interface SearchBarProps {
  onSelectOrganization: (org: FMitrooForeasDto) => void;
}

export default function SearchBar({ onSelectOrganization }: SearchBarProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<FMitrooForeasDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchOrganizations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await organizationAPI.search({
        preferredLabel: searchQuery,
      });
      setResults(response.data.data || []);
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = debounce(searchOrganizations, 300);

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    }
  }, [query]);

  const handleSelect = (org: FMitrooForeasDto) => {
    setQuery(org.preferredLabel);
    setIsOpen(false);
    onSelectOrganization(org);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Αναζητήστε φορέα (π.χ. Υπουργείο, Δήμος, Περιφέρεια...)"
          className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
            {results.map((org) => (
              <button
                key={org.code}
                onClick={() => handleSelect(org)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="font-semibold text-gray-900">
                  {org.preferredLabel}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Κωδικός: {org.code}
                  {org.mainAddress?.postName && (
                    <span className="ml-2">• {org.mainAddress.postName}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* No Results */}
      {query.length >= 2 && !isLoading && results.length === 0 && (
        <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          Δεν βρέθηκαν αποτελέσματα για "{query}"
        </div>
      )}
    </div>
  );
}
