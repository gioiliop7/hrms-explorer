// lib/FavoritesContext.tsx
"use client";

import React, { createContext, useContext } from "react";
import { useFavorites } from "./useFavorites";

// Create context
const FavoritesContext = createContext<ReturnType<typeof useFavorites> | null>(null);

// Provider component
export function FavoritesProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const value = useFavorites();

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Custom hook to use the Favorites context
export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);

  if (!ctx) throw new Error("useFavoritesContext must be used within FavoritesProvider");

  return ctx;
}