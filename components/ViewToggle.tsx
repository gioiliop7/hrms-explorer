// components/ViewToggle.tsx
"use client";

import { Network, List } from "lucide-react";

interface ViewToggleProps {
  view: "tree" | "flow";
  onViewChange: (view: "tree" | "flow") => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => onViewChange("tree")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${
            view === "tree"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }
        `}
      >
        <List className="h-4 w-4" />
        Ιεραρχία
      </button>
      <button
        onClick={() => onViewChange("flow")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${
            view === "flow"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }
        `}
      >
        <Network className="h-4 w-4" />
        Διάγραμμα
      </button>
    </div>
  );
}
