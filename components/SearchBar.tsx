// components/SearchBar.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Loader2, X, Clock } from "lucide-react";
import { organizationAPI } from "@/lib/api";
import { debounce } from "@/lib/utils";
import type { FMitrooForeasDto } from "@/types/api";
import { useSearchParams } from "next/navigation";
import { useFavoritesContext } from "@/lib/FavoritesContext";

interface SearchBarProps {
  onSelectOrganization: (org: FMitrooForeasDto) => void;
  onSelectByCode?: (code: string) => void;
}

export default function SearchBar({ onSelectOrganization, onSelectByCode }: SearchBarProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const { recentSearches } = useFavoritesContext();

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<FMitrooForeasDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchOrganizations = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await organizationAPI.search({ preferredLabel: searchQuery });
      setResults(response.data.data || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useMemo(() => debounce(searchOrganizations, 400), []);

  useEffect(() => {
    setActiveIndex(-1);
    if (query.length >= 2) {
      debouncedSearch(query);
    } else {
      setResults([]);
    }
  }, [query, debouncedSearch]);

  // "/" global shortcut to focus the search input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const recentItems = recentSearches.slice(0, 5);
  const showRecents = showDropdown && query.length === 0 && recentItems.length > 0;
  const showResults = showDropdown && query.length >= 2 && results.length > 0;
  const showNoResults = showDropdown && query.length >= 2 && !isLoading && results.length === 0;
  const navItems = showRecents ? recentItems : results;

  const handleSelect = (org: FMitrooForeasDto) => {
    setQuery(org.preferredLabel);
    setShowDropdown(false);
    setActiveIndex(-1);
    onSelectOrganization(org);
  };

  const handleRecentSelect = (code: string, label: string) => {
    setQuery(label);
    setShowDropdown(false);
    setActiveIndex(-1);
    onSelectByCode?.(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, navItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (showRecents) {
        const item = recentItems[activeIndex];
        handleRecentSelect(item.code, item.preferredLabel);
      } else if (showResults) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => setShowDropdown(false), 150);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Αναζητήστε φορέα (π.χ. Υπουργείο, Δήμος, Περιφέρεια...)"
          className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
          role="combobox"
          aria-label="Αναζήτηση φορέα"
          aria-autocomplete="list"
          aria-controls="search-listbox"
          aria-expanded={showRecents || showResults}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          )}
          {query && !isLoading && (
            <button
              onClick={handleClear}
              className="h-5 w-5 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Καθαρισμός αναζήτησης"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {!query && !isLoading && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-gray-400 border border-gray-200 rounded">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {(showRecents || showResults || showNoResults) && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div
            id="search-listbox"
            role="listbox"
            className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Recent Searches */}
            {showRecents && (
              <>
                <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Πρόσφατες αναζητήσεις
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {recentItems.map((item, i) => (
                    <button
                      key={item.code}
                      role="option"
                      aria-selected={activeIndex === i}
                      onMouseDown={() => handleRecentSelect(item.code, item.preferredLabel)}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                        activeIndex === i ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-700 truncate">
                        {item.preferredLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Search Results */}
            {showResults && (
              <div className="max-h-96 overflow-y-auto">
                {results.map((org, i) => (
                  <button
                    key={org.code}
                    role="option"
                    aria-selected={activeIndex === i}
                    onMouseDown={() => handleSelect(org)}
                    className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                      activeIndex === i ? "bg-blue-50" : "hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{org.preferredLabel}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Κωδικός: {org.code}
                      {org.mainAddress?.postName && (
                        <span className="ml-2">• {org.mainAddress.postName}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {showNoResults && (
              <div className="px-4 py-6 text-center text-gray-500">
                Δεν βρέθηκαν αποτελέσματα για &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
