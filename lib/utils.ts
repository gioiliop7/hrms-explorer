// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OrgmaMonadaTreeDto, FlowNode, FlowEdge } from "@/types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert tree structure to React Flow nodes and edges
export function treeToFlow(
  tree: OrgmaMonadaTreeDto,
  parentPosition = { x: 0, y: 0 },
  level = 0
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const horizontalSpacing = 250;
  const verticalSpacing = 100;

  function traverse(
    node: OrgmaMonadaTreeDto,
    parent: string | null,
    x: number,
    y: number,
    siblingIndex: number
  ) {
    const nodeId = node.code;

    // Calculate position
    const position = {
      x: x + siblingIndex * horizontalSpacing,
      y: y,
    };

    // Add node
    nodes.push({
      id: nodeId,
      type: "custom",
      position,
      data: {
        label: node.preferredLabel,
        code: node.code,
        unitType: node.unitType,
      },
    });

    // Add edge from parent
    if (parent) {
      edges.push({
        id: `${parent}-${nodeId}`,
        source: parent,
        target: nodeId,
        type: "smoothstep",
      });
    }

    // Process children
    if (node.children && node.children.length > 0) {
      const childrenWidth = node.children.length * horizontalSpacing;
      const startX = x - childrenWidth / 2;

      node.children.forEach((child, index) => {
        traverse(child, nodeId, startX, y + verticalSpacing, index);
      });
    }
  }

  traverse(tree, null, parentPosition.x, parentPosition.y, 0);

  return { nodes, edges };
}

// Download file helper
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Format date helper
export function formatDate(dateString?: string): string {
  if (!dateString) return "Μ/Δ";
  const date = new Date(dateString);
  return date.toLocaleDateString("el-GR");
}

// Debounce helper
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Export to JSON
export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  downloadFile(blob, filename);
}

// Export to CSV
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] ?? "")).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, filename);
}

// Get unit type label
export function getUnitTypeLabel(unitType?: number): string {
  // This would be populated from the dictionary API
  const unitTypes: Record<number, string> = {
    1: "Γενική Διεύθυνση",
    2: "Διεύθυνση",
    3: "Τμήμα",
    4: "Γραφείο",
    // Add more as needed
  };
  return unitTypes[unitType || 0] || "Άγνωστος Τύπος";
}
