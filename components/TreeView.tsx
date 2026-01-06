// components/TreeView.tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Building2 } from "lucide-react";
import type { OrgmaMonadaTreeDto } from "@/types/api";
import { exportTreeToCSV } from "@/lib/utils";

interface TreeViewProps {
  tree: OrgmaMonadaTreeDto;
  onSelectUnit: (unitCode: string) => void;
  selectedUnitCode?: string;
}

export default function TreeView({
  tree,
  onSelectUnit,
  selectedUnitCode,
}: TreeViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTree = useMemo(() => {
    function filterTree(node: OrgmaMonadaTreeDto): OrgmaMonadaTreeDto | null {
      const matches =
        node.preferredLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.code.toLowerCase().includes(searchTerm.toLowerCase());

      if (node.children) {
        const children = matches
          ? node.children
          : (node.children
              .map(filterTree)
              .filter(Boolean) as OrgmaMonadaTreeDto[]);

        if (matches || children.length > 0) {
          return { ...node, children };
        }
      } else if (matches) {
        return node;
      }

      return matches ? node : null;
    }

    return searchTerm ? filterTree(tree) : tree;
  }, [tree, searchTerm]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex justify-between gap-3 flex-col md:flex-row my-5 md:my-0 items-center">
        <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Ιεραρχική Δομή
        </h3>
        <input
          type="text"
          placeholder="Αναζήτηση..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 w-full max-w-75 focus:ring-blue-500"
        />
        <button
          onClick={() => exportTreeToCSV(tree)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition max-w-75 text-gov-blue"
        >
          Εξαγωγή CSV
        </button>
      </div>

      <div className="overflow-auto max-h-[600px] my-8">
        {filteredTree ? (
          <TreeNode
            node={filteredTree}
            level={0}
            onSelect={onSelectUnit}
            selectedCode={selectedUnitCode}
          />
        ) : (
          <div className="text-gray-500 text-sm p-3">
            Δεν βρέθηκαν αποτελέσματα
          </div>
        )}
      </div>
    </div>
  );
}

interface TreeNodeProps {
  node: OrgmaMonadaTreeDto;
  level: number;
  onSelect: (unitCode: string) => void;
  selectedCode?: string;
}

function TreeNode({ node, level, onSelect, selectedCode }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedCode === node.code;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer
          transition-colors
          ${isSelected ? "bg-blue-100 text-blue-900" : "hover:bg-gray-50"}
        `}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onSelect(node.code);
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {node.preferredLabel}
          </div>
          <div className="text-xs text-gray-500">{node.code}</div>
        </div>

        {hasChildren && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {node.children!.length}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.code}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedCode={selectedCode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
