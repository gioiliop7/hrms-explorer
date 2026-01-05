// lib/useFavorites.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import type { FMitrooForeasDto } from "@/types/api";

const FAVORITES_KEY = "hrms_favorites";
const RECENT_KEY = "hrms_recent_searches";

interface FavoriteOrganization {
  code: string;
  preferredLabel: string;
  timestamp: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteOrganization[]>([]);
  const [recentSearches, setRecentSearches] = useState<FavoriteOrganization[]>(
    []
  );

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      const storedRecent = localStorage.getItem(RECENT_KEY);

      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      if (storedRecent) {
        setRecentSearches(JSON.parse(storedRecent));
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, []);

  // Check if organization is favorite
  const isFavorite = useCallback(
    (code: string) => {
      return favorites.some((fav) => fav.code === code);
    },
    [favorites]
  );

  // Add to favorites
  const addFavorite = useCallback(
    (organization: FMitrooForeasDto) => {
      const newFavorite: FavoriteOrganization = {
        code: organization.code,
        preferredLabel: organization.preferredLabel,
        timestamp: Date.now(),
      };

      const updatedFavorites = [...favorites, newFavorite];
      setFavorites(updatedFavorites);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    },
    [favorites]
  );

  // Remove from favorites
  const removeFavorite = useCallback(
    (code: string) => {
      const updatedFavorites = favorites.filter((fav) => fav.code !== code);
      setFavorites(updatedFavorites);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    },
    [favorites]
  );

  // Toggle favorite
  const toggleFavorite = useCallback(
    (organization: FMitrooForeasDto) => {
      if (isFavorite(organization.code)) {
        removeFavorite(organization.code);
      } else {
        addFavorite(organization);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  // Add to recent searches
  const addToRecent = useCallback(
    (organization: FMitrooForeasDto) => {
      const newRecent: FavoriteOrganization = {
        code: organization.code,
        preferredLabel: organization.preferredLabel,
        timestamp: Date.now(),
      };

      // Remove duplicates and keep last 10
      const filteredRecent = recentSearches.filter(
        (item) => item.code !== organization.code
      );
      const updatedRecent = [newRecent, ...filteredRecent].slice(0, 10);

      setRecentSearches(updatedRecent);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updatedRecent));
    },
    [recentSearches]
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem(FAVORITES_KEY);
  }, []);

  // Clear recent searches
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
  }, []);

  return {
    favorites,
    recentSearches,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    addToRecent,
    clearFavorites,
    clearRecent,
  };
}
