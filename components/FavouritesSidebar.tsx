// components/FavoritesSidebar.tsx
"use client";

import React, { useEffect } from "react";
import { Star, Clock, Trash2, X } from "lucide-react";
import { useFavoritesContext } from "@/lib/FavoritesContext";

interface FavoritesSidebarProps {
  onSelectOrganization: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function FavoritesSidebar({
  onSelectOrganization,
  isOpen,
  onClose,
}: FavoritesSidebarProps) {
  const {
    favorites,
    recentSearches,
    removeFavorite,
    clearFavorites,
    clearRecent,
  } = useFavoritesContext();

  // Disable body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    // Cleanup on unmount
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" />

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Αγαπημένα & Πρόσφατα
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {/* Favorites Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h3 className="font-semibold text-gray-900">Αγαπημένα</h3>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              </div>
              {favorites.length > 0 && (
                <button
                  onClick={clearFavorites}
                  className="text-xs text-red-600 hover:text-red-700"
                  title="Καθαρισμός όλων"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {favorites.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Δεν έχετε αγαπημένους φορείς
              </p>
            ) : (
              <div className="space-y-2">
                {favorites.map((fav: any) => (
                  <div
                    key={fav.code}
                    className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectOrganization(fav.code);
                      onClose();
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fav.preferredLabel}
                      </p>
                      <p className="text-xs text-gray-500">{fav.code}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(fav.code);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                      title="Αφαίρεση"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Searches Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900">Πρόσφατα</h3>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {recentSearches.length}
                </span>
              </div>
              {recentSearches.length > 0 && (
                <button
                  onClick={clearRecent}
                  className="text-xs text-red-600 hover:text-red-700"
                  title="Καθαρισμός όλων"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {recentSearches.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Δεν υπάρχουν πρόσφατες αναζητήσεις
              </p>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((recent: any) => (
                  <div
                    key={recent.code}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectOrganization(recent.code);
                      onClose();
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {recent.preferredLabel}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(recent.timestamp).toLocaleDateString("el-GR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
