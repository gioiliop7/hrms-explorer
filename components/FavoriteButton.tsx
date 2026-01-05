// components/FavoriteButton.tsx
"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import type { FMitrooForeasDto } from "@/types/api";

interface FavoriteButtonProps {
  organization: FMitrooForeasDto;
  showLabel?: boolean;
}

export default function FavoriteButton({
  organization,
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(organization.code);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(organization);
      }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all
        ${
          favorite
            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }
      `}
      title={favorite ? "Αφαίρεση από αγαπημένα" : "Προσθήκη στα αγαπημένα"}
    >
      <Star
        className={`h-5 w-5 ${favorite ? "fill-yellow-500" : ""}`}
        strokeWidth={favorite ? 0 : 2}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {favorite ? "Αγαπημένο" : "Προσθήκη"}
        </span>
      )}
    </button>
  );
}
