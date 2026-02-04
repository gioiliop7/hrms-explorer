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
  const unitTypes: Record<number, string> = {
    42: "ΑΛΛΟ",
    85: "ΑΥΤΟΤΕΛΕΣ ΓΡΑΦΕΙΟ",
    84: "ΑΥΤΟΤΕΛΕΣ ΤΜΗΜΑ",
    83: "ΑΥΤΟΤΕΛΗΣ ΔΙΕΥΘΥΝΣΗ",
    41: "ΓΕΝΙΚΗ ΓΡΑΜΜΑΤΕΙΑ",
    3: "ΓΕΝΙΚΗ ΔΙΕΥΘΥΝΣΗ",
    1: "ΓΡΑΦΕΙΟ",
    4: "ΔΙΕΥΘΥΝΣΗ",
    5: "ΕΙΔΙΚΗ ΓΡΑΜΜΑΤΕΙΑ",
    82: "ΟΡΓΑΝΟ ΔΙΟΙΚΗΣΗΣ",
    2: "ΤΜΗΜΑ",
    22: "ΥΠΟΔΙΕΥΘΥΝΣΗ",
    61: "ΦΟΡΕΑΣ",
    81: "ΦΟΡΕΑΣ Δ",
  };

  return unitTypes[unitType || 0] || "Άγνωστος Τύπος";
}

export function flattenTree(
  node: OrgmaMonadaTreeDto,
  level = 0,
  parentCode: string | null = null,
  acc: any[] = []
) {
  acc.push({
    code: node.code,
    label: node.preferredLabel,
    level,
    parentCode,
  });

  if (node.children) {
    node.children.forEach((child) =>
      flattenTree(child, level + 1, node.code, acc)
    );
  }

  return acc;
}

export function exportTreeToCSV(tree: OrgmaMonadaTreeDto) {
  const rows = flattenTree(tree);

  const header = ["Code", "Label", "Level", "ParentCode"];
  const csvContent = [
    header.join(","),
    ...rows.map((row) =>
      [
        row.code,
        `"${row.label.replace(/"/g, '""')}"`,
        row.level,
        row.parentCode ?? "",
      ].join(",")
    ),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "org-structure.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export function getEducationLabel(category: number): string {
  const labels: Record<number, string> = {
    1: "ΠΕ",
    2: "ΤΕ",
    3: "ΔΕ",
    4: "ΥΕ",
  };
  return labels[category] || `Κατηγορία ${category}`;
}

export const ENTITY_TYPE_MAP: Record<number, string> = {
  24: "ΑΝΕΞΑΡΤΗΤΕΣ ΔΙΟΙΚΗΤΙΚΕΣ ΑΡΧΕΣ",
  21: "ΑΝΕΞΑΡΤΗΤΕΣ ΥΠΗΡΕΣΙΕΣ ΤΗΣ ΠΟΛΙΤΕΙΑΚΗΣ ΗΓΕΣΙΑΣ",
  31: "ΑΠΟΚΕΝΤΡΩΜΕΝΕΣ ΔΙΟΙΚΗΣΕΙΣ",
  23: "ΔΗΜOΣΙΕΣ ΑΡΧEΣ ΤΗΣ ΔΙΚΑΣΤΙΚΗΣ ΛΕΙΤΟΥΡΓIΑΣ",
  22: "ΔΗΜOΣΙΕΣ ΑΡΧEΣ ΤΗΣ ΝΟΜΟΘΕΤΙΚHΣ ΛΕΙΤΟΥΡΓIΑΣ",
  50: "ΝΟΜΙΚΑ ΠΡΟΣΩΠΑ ΙΔΙΩΤΙΚΟΥ ΔΙΚΑΙΟΥ",
  28: "ΝΠΔΔ ΤΩΝ ΟΤΑ",
  29: "ΟΤΑ Α ΒΑΘΜΟΥ (ΚΑΛΛΙΚΡΑΤΗΣ)",
  20: "ΟΤΑ Α ΒΑΘΜΟΥ (ΚΑΠΟΔΙΣΤΡΙΑΣ)",
  27: "ΟΤΑ Β ΒΑΘΜΟΥ",
  26: "ΠΕΡΙΦΕΡΕΙΕΣ",
  25: "ΥΠΟΥΡΓΕΙΑ",
  14: "ΦΟΡΕΙΣ ΔΗΜΟΣΙΩΝ ΥΠΗΡΕΣΙΩΝ",
  13: "ΦΟΡΕΙΣ ΝΠΔΔ",
  12: "ΦΟΡΕΙΣ ΟΤΑ",
};
export interface RankDto {
  id: number;
  description: string;
}

export const RANKS_DATA: RankDto[] = [
  { id: 82318, description: "1ος" },
  { id: 82319, description: "2ος" },
  { id: 82320, description: "3ος" },
  { id: 82321, description: "4ος" },
  { id: 82322, description: "5ος" },
  { id: 82323, description: "6ος" },
  { id: 82324, description: "7ος" },
  { id: 5261, description: "Α΄" },
  { id: 21042, description: "Α1" },
  { id: 21043, description: "Α2" },
  { id: 21044, description: "Α3" },
  { id: 21045, description: "Α4" },
  { id: 21046, description: "Α5" },
  { id: 21047, description: "Α6" },
  { id: 21048, description: "Α7" },
  { id: 5256, description: "ΑΓΡΟΝΟΜΙΚΟΣ ΔΙΕΥΘΥΝΤΗΣ" },
  { id: 5257, description: "ΑΓΡΟΝΟΜΙΚΟΣ ΥΠΟΔΙΕΥΘΥΝΤΗΣ" },
  { id: 5258, description: "ΑΓΡΟΝΟΜΟΣ" },
  { id: 5259, description: "ΑΓΡΟΦΥΛΑΚΑΣ" },
  { id: 23969, description: "ΑΔΙΑΒΑΘΜΗΤΟΣ" },
  { id: 21049, description: "ΑΙΔΕΣΙΜΟΤΑΤΟΣ" },
  { id: 5251, description: "ΑΚΟΛΟΥΘΟΣ  Ο.Ε.Υ." },
  { id: 114439, description: "ΑΚΟΛΟΥΘΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ" },
  { id: 5179, description: "ΑΚΟΛΟΥΘΟΣ ΠΡΕΣΒΕΙΑΣ" },
  { id: 21050, description: "ΑΝΑΠΛΗΡΩΤΗΣ ΔΙΕΥΘΥΝΤΗΣ" },
  { id: 5158, description: "ΑΝΑΠΛΗΡΩΤΗΣ ΔΙΕΥΘΥΝΤΗΣ Ε.Σ.Υ." },
  { id: 23128, description: "ΑΝΑΠΛΗΡΩΤΗΣ ΔΙΟΙΚΗΤΗΣ ΝΟΣΟΚΟΜΕΙΟΥ" },
  { id: 9402, description: "ΑΝΑΠΛΗΡΩΤΗΣ ΚΑΘΗΓΗΤΗΣ" },
  { id: 5199, description: "ΑΝΑΠΛΗΡΩΤΗΣ ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ" },
  {
    id: 5207,
    description:
      "ΑΝΑΠΛΗΡΩΤΗΣ ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ ΑΕΙ  ΜΕ ΚΑΘ.ΚΟΣΜΗΤΟΡΑ - ΠΡΟΕΔΡΟΥ ΤΜΗΜΑΤΟΣ",
  },
  {
    id: 5206,
    description: "ΑΝΑΠΛΗΡΩΤΗΣ ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ ΜΕ ΚΑΘΗΚΟΝΤΑ ΑΝΤΙΠΡΥΤΑΝΗ",
  },
  {
    id: 5205,
    description: "ΑΝΑΠΛΗΡΩΤΗΣ ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ ΜΕ ΚΑΘΗΚΟΝΤΑ ΠΡΥΤΑΝΗ",
  },
  { id: 5213, description: "ΑΝΑΠΛΗΡΩΤΗΣ ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΕΠ ΤΕΙ" },
  { id: 5171, description: "ΑΝΑΠΛΗΡΩΤΗΣ ΝΟΜΙΚΟΣ ΣΥΜΒΟΥΛΟΣ" },
  { id: 5014, description: "ΑΝΘΥΠΑΣΠΙΣΤΗΣ" },
  { id: 5084, description: "ΑΝΘΥΠΑΣΠΙΣΤΗΣ Λ.Σ" },
  { id: 5068, description: "ΑΝΘΥΠΑΣΤΥΝΟΜΟΣ" },
  { id: 21051, description: "ΑΝΘΥΠΙΑΤΡΟΣ" },
  { id: 21052, description: "ΑΝΘΥΠΙΛΑΡΧΟΣ" },
  { id: 5013, description: "ΑΝΘΥΠΟΛΟΧΑΓΟΣ" },
  { id: 5030, description: "ΑΝΘΥΠΟΠΛΟΙΑΡΧΟΣ" },
  { id: 5082, description: "ΑΝΘΥΠΟΠΛΟΙΑΡΧΟΣ Λ.Σ" },
  { id: 5099, description: "ΑΝΘΥΠΟΠΥΡΑΓΟΣ Π.Σ" },
  { id: 5050, description: "ΑΝΘΥΠΟΣΜΗΝΑΓΟΣ" },
  { id: 22820, description: "ΑΝΤΕΙΣΑΓΓΕΛΕΑΣ" },
  { id: 5126, description: "ΑΝΤΕΙΣΑΓΓΕΛΕΑΣ ΕΦΕΤΩΝ" },
  { id: 5134, description: "ΑΝΤΕΙΣΑΓΓΕΛΕΑΣ ΠΡΩΤΟΔΙΚΩΝ" },
  { id: 5117, description: "ΑΝΤΕΙΣΑΓΓΕΛΕΑΣ ΤΟΥ ΑΡΕΙΟΥ ΠΑΓΟΥ" },
  { id: 117476, description: "ΑΝΤΕΠΙΤΡΟΠΟΣ ΔΙΟΙΚΗΤΙΚΩΝ ΔΙΚΑΣΤΗΡΙΩΝ" },
  { id: 5120, description: "ΑΝΤΕΠΙΤΡΟΠΟΣ ΕΠΙΚΡΑΤΕΙΑΣ ΤΩΝ Τ.Δ.Δ." },
  { id: 5119, description: "ΑΝΤΕΠΙΤΡΟΠΟΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  { id: 22930, description: "ΑΝΤΙΔΗΜΑΡΧΟΣ" },
  { id: 5023, description: "ΑΝΤΙΝΑΥΑΡΧΟΣ" },
  { id: 5075, description: "ΑΝΤΙΝΑΥΑΡΧΟΣ Λ.Σ" },
  { id: 5027, description: "ΑΝΤΙΠΛΟΙΑΡΧΟΣ" },
  { id: 5079, description: "ΑΝΤΙΠΛΟΙΑΡΧΟΣ Λ.Σ" },
  { id: 5111, description: "ΑΝΤΙΠΡΟΕΔΡΟΣ Σ.Τ.Ε." },
  { id: 5112, description: "ΑΝΤΙΠΡΟΕΔΡΟΣ ΤΟΥ ΑΡΕΙΟΥ ΠΑΓΟΥ" },
  { id: 5113, description: "ΑΝΤΙΠΡΟΕΔΡΟΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  { id: 5147, description: "ΑΝΤΙΠΡΟΕΔΡΟΣ ΤΟΥ ΝΟΜΙΚΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΟΥ ΚΡΑΤΟΥΣ" },
  { id: 117528, description: "ΑΝΤΙΠΡΟΕΔΡΟΣ ΤΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ" },
  { id: 5042, description: "ΑΝΤΙΠΤΕΡΑΡΧΟΣ" },
  { id: 5095, description: "ΑΝΤΙΠΥΡΑΡΧΟΣ Π.Σ" },
  { id: 5046, description: "ΑΝΤΙΣΜΗΝΑΡΧΟΣ" },
  { id: 5005, description: "ΑΝΤΙΣΤΡΑΤΗΓΟΣ" },
  { id: 5091, description: "ΑΝΤΙΣΤΡΑΤΗΓΟΣ Π.Σ." },
  { id: 5009, description: "ΑΝΤΙΣΥΝΤΑΓΜΑΤΑΡΧΗΣ" },
  { id: 5116, description: "ΑΡΕΟΠΑΓΙΤΗΣ" },
  { id: 5039, description: "ΑΡΧΗΓΟΣ Γ.Ε.Α." },
  { id: 5000, description: "ΑΡΧΗΓΟΣ Γ.Ε.ΕΘ.Α" },
  { id: 5020, description: "ΑΡΧΗΓΟΣ Γ.Ε.Ν." },
  { id: 5003, description: "ΑΡΧΗΓΟΣ Γ.Ε.Σ." },
  { id: 5058, description: "ΑΡΧΗΓΟΣ ΕΛ.ΑΣ." },
  { id: 5255, description: "ΑΡΧΗΓΟΣ ΕΛΛΗΝΙΚΗΣ ΑΓΡΟΦΥΛΑΚΗΣ" },
  { id: 5073, description: "ΑΡΧΗΓΟΣ ΛΙΜΕΝΙΚΟΥ ΣΩΜΑΤΟΣ" },
  { id: 5090, description: "ΑΡΧΗΓΟΣ Π.Σ" },
  { id: 5021, description: "ΑΡΧΗΓΟΣ ΣΤΟΛΟΥ" },
  { id: 5040, description: "ΑΡΧΗΓΟΣ Τ.Α." },
  { id: 21053, description: "ΑΡΧΙΑΤΡΟΣ" },
  { id: 21054, description: "ΑΡΧΙΔΙΑΚΟΝΟΣ" },
  { id: 5180, description: "ΑΡΧΙΕΠΙΣΚΟΠΟΣ" },
  { id: 21055, description: "ΑΡΧΙΕΡΑΤΙΚΟΣ ΕΠΙΤΡΟΠΟΣ" },
  { id: 5033, description: "ΑΡΧΙΚΕΛΕΥΣΤΗΣ" },
  { id: 5085, description: "ΑΡΧΙΚΕΛΕΥΣΤΗΣ Λ.Σ" },
  { id: 5015, description: "ΑΡΧΙΛΟΧΙΑΣ" },
  { id: 21056, description: "ΑΡΧΙΜΑΓΕΙΡΑΣ" },
  { id: 21057, description: "ΑΡΧΙΜΑΝΔΡΙΤΗΣ" },
  { id: 5185, description: "ΑΡΧΙΜΟΥΣΙΚΟΣ - ΕΞΑΡΧΩΝ" },
  { id: 5025, description: "ΑΡΧΙΠΛΟΙΑΡΧΟΣ" },
  { id: 5077, description: "ΑΡΧΙΠΛΟΙΑΡΧΟΣ Λ.Σ" },
  { id: 5093, description: "ΑΡΧΙΠΥΡΑΡΧΟΣ Π.Σ" },
  { id: 21058, description: "ΑΡΧΙΠΥΡΟΣΒΕΣΤΗΣ Π.Ν." },
  { id: 5101, description: "ΑΡΧΙΠΥΡΟΣΒΕΣΤΗΣ Π.Σ" },
  { id: 5052, description: "ΑΡΧΙΣΜΗΝΙΑΣ" },
  { id: 5252, description: "ΑΡΧΙΤΑΞΙΝΟΜΟΣ" },
  { id: 21059, description: "ΑΡΧΙΤΕΧΝΙΤΗΣ" },
  { id: 5069, description: "ΑΡΧΙΦΥΛΑΚΑΣ" },
  { id: 5062, description: "ΑΣΤΥΝΟΜΙΚΟΣ Δ/ΝΤΗΣ" },
  { id: 5063, description: "ΑΣΤΥΝΟΜΙΚΟΣ ΥΠ/ΝΤΗΣ" },
  { id: 117393, description: "ΑΣΤΥΝΟΜΟΣ" },
  { id: 5064, description: "ΑΣΤΥΝΟΜΟΣ Α΄" },
  { id: 5065, description: "ΑΣΤΥΝΟΜΟΣ Β΄" },
  { id: 5071, description: "ΑΣΤΥΦΥΛΑΚΑΣ" },
  { id: 5262, description: "Β΄" },
  { id: 21060, description: "Β1" },
  { id: 21061, description: "Β2" },
  { id: 21062, description: "Β3" },
  { id: 21063, description: "Β4" },
  { id: 21064, description: "Β5" },
  { id: 21065, description: "Β6" },
  { id: 21066, description: "Β7" },
  { id: 21067, description: "Β8" },
  { id: 9405, description: "ΒΑΘΜΙΔΑ Α" },
  { id: 9406, description: "ΒΑΘΜΙΔΑ Β" },
  { id: 9407, description: "ΒΑΘΜΙΔΑ Γ" },
  { id: 9408, description: "ΒΑΘΜΙΔΑ Δ" },
  { id: 5184, description: "ΒΟΗΘΟΣ ΕΠΙΣΚΟΠΟΣ" },
  { id: 5263, description: "Γ΄" },
  { id: 22900, description: "ΓΕΝΙΚΟΣ ΔΙΕΥΘΥΝΤΗΣ" },
  { id: 117495, description: "ΓΕΝΙΚΟΣ ΕΠΙΘΕΩΡΗΤΗΣ ΣΤΡΑΤΟΥ (ΓΕΠΣ)" },
  {
    id: 5109,
    description: "ΓΕΝΙΚΟΣ ΕΠΙΤΡΟΠΟΣ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ",
  },
  { id: 5110, description: "ΓΕΝΙΚΟΣ ΕΠΙΤΡΟΠΟΣ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ ΤΩΝ Τ.Δ.Δ." },
  { id: 5244, description: "ΓΕΝΙΚΟΣ ΣΥΜΒΟΥΛΟΣ Α΄ Ο.Ε.Υ." },
  { id: 5246, description: "ΓΕΝΙΚΟΣ ΣΥΜΒΟΥΛΟΣ Β΄ Ο.Ε.Υ." },
  { id: 81892, description: "ΓΕΝΙΚΟΣ ΣΥΜΒΟΥΛΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Α΄" },
  { id: 81893, description: "ΓΕΝΙΚΟΣ ΣΥΜΒΟΥΛΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Β΄" },
  { id: 21068, description: "ΓΡΑΜΜΑΤΕΑΣ B ΕΠΙΚΟΙΝΩΝΙΑΣ" },
  { id: 21069, description: "ΓΡΑΜΜΑΤΕΑΣ Α ΕΠΙΚΟΙΝΩΝΙΑΣ" },
  { id: 21070, description: "ΓΡΑΜΜΑΤΕΑΣ Α΄" },
  { id: 5248, description: "ΓΡΑΜΜΑΤΕΑΣ Α΄ Ο.Ε.Υ." },
  { id: 21071, description: "ΓΡΑΜΜΑΤΕΑΣ Β΄" },
  { id: 5249, description: "ΓΡΑΜΜΑΤΕΑΣ Β΄ Ο.Ε.Υ." },
  { id: 21072, description: "ΓΡΑΜΜΑΤΕΑΣ Γ΄" },
  { id: 5250, description: "ΓΡΑΜΜΑΤΕΑΣ Γ΄ Ο.Ε.Υ." },
  { id: 21073, description: "ΓΡΑΜΜΑΤΕΑΣ Δ΄" },
  { id: 21074, description: "ΓΡΑΜΜΑΤΕΑΣ Ε΄" },
  { id: 23218, description: "ΓΡΑΜΜΑΤΕΑΣ ΕΠΙΚΟΙΝΩΝΙΑΣ" },
  { id: 23216, description: "ΓΡΑΜΜΑΤΕΑΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Α'" },
  { id: 23217, description: "ΓΡΑΜΜΑΤΕΑΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Β'" },
  { id: 114438, description: "ΓΡΑΜΜΑΤΕΑΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Γ΄" },
  { id: 5175, description: "ΓΡΑΜΜΑΤΕΑΣ ΠΡΕΣΒΕΙΑΣ Α΄ ΤΑΞΕΩΣ" },
  { id: 5177, description: "ΓΡΑΜΜΑΤΕΑΣ ΠΡΕΣΒΕΙΑΣ Β΄ ΤΑΞΕΩΣ" },
  { id: 5178, description: "ΓΡΑΜΜΑΤΕΑΣ ΠΡΕΣΒΕΙΑΣ Γ΄ ΤΑΞΕΩΣ" },
  { id: 5264, description: "Δ΄" },
  { id: 22898, description: "Δ1" },
  { id: 22899, description: "Δ2" },
  { id: 9390, description: "ΔOΚΙΜΟΣ ΥΠΑΣΤΥΝΟΜΟΣ" },
  { id: 5018, description: "ΔΕΚΑΝΕΑΣ" },
  { id: 20007, description: "ΔΕΝ ΒΡΙΣΚΩ ΤΟΝ ΒΑΘΜΟ ΜΟΥ" },
  { id: 117021, description: "ΔΗΜΟΤΙΚΟΣ ΑΣΤΥΝΟΜΙΚΟΣ Α'" },
  { id: 117022, description: "ΔΗΜΟΤΙΚΟΣ ΑΣΤΥΝΟΜΙΚΟΣ Β'" },
  { id: 117023, description: "ΔΗΜΟΤΙΚΟΣ ΑΣΤΥΝΟΜΙΚΟΣ Γ'" },
  { id: 117019, description: "ΔΗΜΟΤΙΚΟΣ ΑΣΤΥΝΟΜΟΣ Α'" },
  { id: 117020, description: "ΔΗΜΟΤΙΚΟΣ ΑΣΤΥΝΟΜΟΣ Β'" },
  { id: 21075, description: "ΔΙΑΚΟΝΟΣ" },
  { id: 21076, description: "ΔΙΕΥΘΥΝΤΗΣ" },
  { id: 114440, description: "ΔΙΕΥΘΥΝΤΗΣ Α΄" },
  { id: 114441, description: "ΔΙΕΥΘΥΝΤΗΣ Β΄" },
  { id: 5157, description: "ΔΙΕΥΘΥΝΤΗΣ ΓΙΑΤΡΟΣ ΕΘΝΙΚΟΥ ΣΥΣΤΗΜΑΤΟΣ ΥΓΕΙΑΣ" },
  { id: 23151, description: "ΔΙΕΥΘΥΝΤΗΣ ΤΜΗΜΑΤΟΣ" },
  { id: 21077, description: "ΔΙΚΑΣΤΙΚΟΣ ΑΝΤΙΠΡΟΣΩΠΟΣ Α΄" },
  {
    id: 5150,
    description:
      "ΔΙΚΑΣΤΙΚΟΣ ΑΝΤΙΠΡΟΣΩΠΟΣ Α΄ ΤΑΞΕΩΣ ΤΟΥ ΝΟΜΙΚΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΟΥ ΚΡΑΤΟΥΣ",
  },
  { id: 21078, description: "ΔΙΚΑΣΤΙΚΟΣ ΑΝΤΙΠΡΟΣΩΠΟΣ Β΄" },
  {
    id: 5151,
    description: "ΔΙΚΑΣΤΙΚΟΣ ΑΝΤΙΠΡΟΣΩΠΟΣ ΤΟΥ ΝΟΜΙΚΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΟΥ ΚΡΑΤΟΥΣ",
  },
  { id: 21079, description: "ΔΙΚΑΣΤΙΚΟΣ ΠΑΡΕΔΡΟΣ" },
  { id: 21080, description: "ΔΙΚΑΣΤΙΚΟΣ ΣΥΜΒΟΥΛΟΣ Α" },
  { id: 21081, description: "ΔΙΚΑΣΤΙΚΟΣ ΣΥΜΒΟΥΛΟΣ Β" },
  { id: 21082, description: "ΔΙΚΑΣΤΙΚΟΣ ΣΥΜΒΟΥΛΟΣ Γ" },
  { id: 117523, description: "ΔΙΚΗΓΟΡΟΣ ΜΕ ΕΜΜΙΣΘΗ ΕΝΤΟΛΗ" },
  { id: 21083, description: "ΔΙΟΙΚΗΤΗΣ" },
  { id: 117496, description: "ΔΙΟΙΚΗΤΗΣ 1ΗΣ ΣΤΡΑΤΙΑΣ" },
  { id: 5036, description: "ΔΙΟΠΟΣ" },
  { id: 5057, description: "ΔΟΚΙΜΟΙ ΥΠΑΞΙΩΜΑΤΙΚΟΙ" },
  { id: 21085, description: "ΔΟΚΙΜΟΣ ΑΝΘΥΠΟΠΥΡΑΓΟΣ" },
  { id: 21086, description: "ΔΟΚΙΜΟΣ ΑΝΘΥΠΟΣΜΗΝΑΓΟΣ" },
  { id: 21087, description: "ΔΟΚΙΜΟΣ ΑΞΙΩΜΑΤΙΚΟΣ" },
  { id: 5072, description: "ΔΟΚΙΜΟΣ ΑΣΤΥΦΥΛΑΚΑΣ" },
  { id: 21084, description: "ΔΟΚΙΜΟΣ ΔΗΜΟΣΙΟΣ ΥΠΑΛΛΗΛΟΣ" },
  {
    id: 5152,
    description:
      "ΔΟΚΙΜΟΣ ΔΙΚΑΣΤΙΚΟΣ ΑΝΤΙΠΡΟΣΩΠΟΣ ΤΟΥ ΝΟΜΙΚΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΟΥ ΚΡΑΤΟΥΣ",
  },
  { id: 21088, description: "ΔΟΚΙΜΟΣ ΔΙΚΑΣΤΙΚΟΣ ΠΑΡΕΔΡΟΣ" },
  { id: 23636, description: "ΔΟΚΙΜΟΣ ΕΙΡΗΝΟΔΙΚΗΣ" },
  {
    id: 115337,
    description:
      "ΔΟΚΙΜΟΣ ΕΙΣΗΓΗΤΗΣ ΤΗΣ ΓΕΝΙΚΗΣ ΕΠΙΤΡΟΠΕΙΑΣ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ ΣΤΟ ΕΛΕΓΚΤΙΚΟ ΣΥΝΕΔΡΙΟ",
  },
  { id: 5140, description: "ΔΟΚΙΜΟΣ ΕΙΣΗΓΗΤΗΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  { id: 5139, description: "ΔΟΚΙΜΟΣ ΕΙΣΗΓΗΤΗΣ ΤΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ" },
  { id: 21089, description: "ΔΟΚΙΜΟΣ ΕΦΕΔΡΟΣ ΑΞΙΩΜΑΤΙΚΟΣ" },
  { id: 117498, description: "ΔΟΚΙΜΟΣ ΚΕΛΕΥΣΤΗΣ" },
  { id: 23556, description: "ΔΟΚΙΜΟΣ ΚΕΛΕΥΣΤΗΣ ΛΣ" },
  { id: 21090, description: "ΔΟΚΙΜΟΣ ΛΙΜΕΝΟΦΥΛΑΚΑΣ" },
  { id: 5104, description: "ΔΟΚΙΜΟΣ ΠΥΡΟΣΒΕΣΤΗΣ Π.Σ." },
  { id: 117525, description: "ΔΟΚΙΜΟΣ ΣΗΜΑΙΟΦΟΡΟΣ Λ.Σ." },
  { id: 117502, description: "ΔΟΚΙΜΟΣ ΥΠΑΞΙΩΜΑΤΙΚΟΣ" },
  { id: 21091, description: "ΔΟΚΙΜΟΣ ΥΠΑΣΤΥΝΟΜΟΣ" },
  { id: 5265, description: "Ε΄" },
  { id: 5162, description: "ΕΙΔΙΚΕΥΟΜΕΝΟΣ ΓΙΑΤΡΟΣ ΕΘΝΙΚΟΥ ΣΥΣΤΗΜΑΤΟΣ ΥΓΕΙΑΣ" },
  {
    id: 22806,
    description: "ΕΙΔΙΚΟ ΤΕΧΝΙΚΟ ΠΡΟΣΩΠΙΚΟ ΑΚΑΔΗΜΙΑΣ ΕΜΠΟΡΙΚΟΥ ΝΑΥΤΙΚΟΥ",
  },
  { id: 22817, description: "ΕΙΔΙΚΟΙ ΦΡΟΥΡΟΙ" },
  { id: 5269, description: "ΕΙΔΙΚΟΣ ΕΙΣΗΓΗΤΗΣ Α ΤΑΞΕΩΣ" },
  { id: 5268, description: "ΕΙΔΙΚΟΣ ΕΙΣΗΓΗΤΗΣ Β ΤΑΞΕΩΣ" },
  { id: 5267, description: "ΕΙΔΙΚΟΣ ΕΙΣΗΓΗΤΗΣ Γ ΤΑΞΕΩΣ" },
  { id: 5221, description: "ΕΙΔΙΚΟΣ ΛΕΙΤ. ΕΠΙΣΤΗΜΟΝΑΣ Α΄" },
  { id: 5222, description: "ΕΙΔΙΚΟΣ ΛΕΙΤ. ΕΠΙΣΤΗΜΟΝΑΣ Β΄" },
  { id: 5223, description: "ΕΙΔΙΚΟΣ ΛΕΙΤ. ΕΠΙΣΤΗΜΟΝΑΣ Γ΄" },
  { id: 5224, description: "ΕΙΔΙΚΟΣ ΛΕΙΤ. ΕΠΙΣΤΗΜΟΝΑΣ Δ΄" },
  { id: 5241, description: "ΕΙΔΙΚΟΣ ΠΑΡΕΔΡΟΣ ΠΑΙΔΑΓΩΓΙΚΟΥ ΙΝΣΤΙΤΟΥΤΟΥ" },
  { id: 22675, description: "ΕΙΔΙΚΟΣ ΦΡΟΥΡΟΣ" },
  { id: 21092, description: "ΕΙΔΙΚΩΝ ΘΕΣΕΩΝ" },
  { id: 5132, description: "ΕΙΡΗΝΟΔΙΚΗΣ Α΄ ΤΑΞΗΣ" },
  { id: 5136, description: "ΕΙΡΗΝΟΔΙΚΗΣ Β΄ ΤΑΞΗΣ" },
  { id: 5144, description: "ΕΙΡΗΝΟΔΙΚΗΣ Γ΄ ΤΑΞΗΣ" },
  { id: 5145, description: "ΕΙΡΗΝΟΔΙΚΗΣ Δ΄ ΤΑΞΗΣ" },
  { id: 5122, description: "ΕΙΣΑΓΓΕΛΕΑΣ ΕΦΕΤΩΝ" },
  { id: 5131, description: "ΕΙΣΑΓΓΕΛΕΑΣ ΠΡΩΤΟΔΙΚΩΝ" },
  { id: 5107, description: "ΕΙΣΑΓΓΕΛΕΑΣ ΤΟΥ ΑΡΕΙΟΥ ΠΑΓΟΥ" },
  { id: 22974, description: "ΕΙΣΑΓΓΕΛΙΚΟΣ ΠΑΡΕΔΡΟΣ" },
  { id: 22880, description: "ΕΙΣΗΓΗΤΗΣ" },
  {
    id: 115336,
    description:
      "ΕΙΣΗΓΗΤΗΣ ΤΗΣ ΓΕΝΙΚΗΣ ΕΠΙΤΡΟΠΕΙΑΣ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ ΣΤΟ ΕΛΕΓΚΤΙΚΟ ΣΥΝΕΔΡΙΟ",
  },
  { id: 5176, description: "ΕΙΣΗΓΗΤΗΣ ΤΗΣ ΕΙΔΙΚΗΣ ΝΟΜΙΚΗΣ ΥΠΗΡΕΣΙΑΣ" },
  { id: 5138, description: "ΕΙΣΗΓΗΤΗΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  {
    id: 5243,
    description: "ΕΙΣΗΓΗΤΗΣ ΤΟΥ ΙΝΣΤΙΤΟΥΤΟΥ ΤΕΧΝΟΛΟΓΙΚΗΣ ΕΚΠΑΙΔΕΥΣΗΣ",
  },
  { id: 5137, description: "ΕΙΣΗΓΗΤΗΣ ΤΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ" },
  { id: 5172, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ Α΄ ΤΑΞΕΩΣ" },
  { id: 5174, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ Β΄ ΤΑΞΕΩΣ" },
  { id: 22881, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ ΠΡΕΣΒΕΥΤΗΣ ΣΥΜΒΟΥΛΟΣ Α" },
  { id: 5165, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ ΠΡΕΣΒΕΥΤΗΣ ΣΥΜΒΟΥΛΟΣ Α΄ ΤΑΞΕΩΣ" },
  { id: 22882, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ ΠΡΕΣΒΕΥΤΗΣ ΣΥΜΒΟΥΛΟΣ Β" },
  { id: 5169, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ ΠΡΕΣΒΕΥΤΗΣ ΣΥΜΒΟΥΛΟΣ Β΄ ΤΑΞΕΩΣ" },
  { id: 22883, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ ΣΥΜΒΟΥΛΟΣ Α" },
  { id: 22884, description: "ΕΜΠΕΙΡΟΓΝΩΜΟΝΑΣ ΣΥΜΒΟΥΛΟΣ Β" },
  { id: 22990, description: "ΕΞΕΙΔΙΚΕΥΟΜΕΝΟΣ ΙΑΤΡΟΣ Ε.Σ.Υ." },
  { id: 5034, description: "ΕΠΙΚΕΛΕΥΣΤΗΣ" },
  { id: 5086, description: "ΕΠΙΚΕΛΕΥΣΤΗΣ Λ.Σ." },
  { id: 22821, description: "ΕΠΙΚΟΥΡΙΚΟΙ ΙΑΤΡΟΙ" },
  { id: 21093, description: "ΕΠΙΚΟΥΡΙΚΟΣ ΕΠΙΜΕΛΗΤΗΣ Α΄" },
  { id: 21094, description: "ΕΠΙΚΟΥΡΙΚΟΣ ΕΠΙΜΕΛΗΤΗΣ Β΄" },
  { id: 9403, description: "ΕΠΙΚΟΥΡΟΣ ΚΑΘΗΓΗΤΗΣ" },
  { id: 5190, description: "ΕΠΙΚΟΥΡΟΣ ΚΑΘΗΓΗΤΗΣ ΑΚΑΔΗΜΙΑΣ ΕΜΠΟΡΙΚΟΥ ΝΑΥΤΙΚΟΥ" },
  { id: 5200, description: "ΕΠΙΚΟΥΡΟΣ ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ ΠΑΝΕΠΙΣΤΗΜΙΟΥ" },
  { id: 5214, description: "ΕΠΙΚΟΥΡΟΣ ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΕΠ ΤΕΙ" },
  { id: 21095, description: "ΕΠΙΛΑΡΧΟΣ" },
  { id: 5016, description: "ΕΠΙΛΟΧΙΑΣ" },
  { id: 5254, description: "ΕΠΙΜΕΛΗΤΗΣ" },
  { id: 23605, description: "ΕΠΙΜΕΛΗΤΗΣ Α'" },
  { id: 5159, description: "ΕΠΙΜΕΛΗΤΗΣ Α΄ ΓΙΑΤΡΟΣ ΕΘΝΙΚΟΥ ΣΥΣΤΗΜΑΤΟΣ ΥΓΕΙΑΣ" },
  { id: 5191, description: "ΕΠΙΜΕΛΗΤΗΣ ΑΚΑΔΗΜΙΑΣ ΕΜΠΟΡΙΚΟΥ ΝΑΥΤΙΚΟΥ" },
  { id: 5160, description: "ΕΠΙΜΕΛΗΤΗΣ Β΄ ΓΙΑΤΡΟΣ ΕΘΝΙΚΟΥ ΣΥΣΤΗΜΑΤΟΣ ΥΓΕΙΑΣ" },
  { id: 5161, description: "ΕΠΙΜΕΛΗΤΗΣ Γ΄ ΓΙΑΤΡΟΣ ΕΘΝΙΚΟΥ ΣΥΣΤΗΜΑΤΟΣ ΥΓΕΙΑΣ" },
  { id: 5096, description: "ΕΠΙΠΥΡΑΓΟΣ Π.Σ" },
  { id: 21096, description: "ΕΠΙΣΚΟΠΟΣ" },
  { id: 5047, description: "ΕΠΙΣΜΗΝΑΓΟΣ" },
  { id: 5053, description: "ΕΠΙΣΜΗΝΙΑΣ" },
  { id: 21097, description: "ΕΠΙΣΤΑΤΗΣ" },
  { id: 117351, description: "ΕΠΙΤΡΟΠΟΣ ΕΠΙΚΡΑΤΕΙΑΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  { id: 5114, description: "ΕΠΙΤΡΟΠΟΣ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ ΤΩΝ Τ.Δ.Δ." },
  { id: 22803, description: "ΕΠΟΠ ΛΟΧΙΑΣ" },
  { id: 21098, description: "ΕΠΟΠΤΗΣ" },
  { id: 5217, description: "ΕΡΕΥΝΗΤΗΣ Α΄" },
  { id: 5218, description: "ΕΡΕΥΝΗΤΗΣ Β΄" },
  { id: 5219, description: "ΕΡΕΥΝΗΤΗΣ Γ΄" },
  { id: 5220, description: "ΕΡΕΥΝΗΤΗΣ Δ΄" },
  { id: 5232, description: "ΕΡΕΥΝΗΤΗΣ Ε΄" },
  { id: 5233, description: "ΕΡΕΥΝΗΤΗΣ ΣΤ΄" },
  { id: 5125, description: "ΕΦΕΤΗΣ" },
  { id: 5128, description: "ΕΦΕΤΗΣ ΔΙΟΙΚΗΤΙΚΩΝ ΔΙΚΑΣΤΗΡΙΩΝ" },
  { id: 117521, description: "ΕΦΗΜΕΡΙΟΣ" },
  { id: 5153, description: "ΙΑΤΡΟΔΙΚΑΣΤΗΣ Α΄ ΤΑΞΕΩΣ" },
  { id: 5154, description: "ΙΑΤΡΟΔΙΚΑΣΤΗΣ Β΄ ΤΑΞΕΩΣ" },
  { id: 5155, description: "ΙΑΤΡΟΔΙΚΑΣΤΗΣ Γ΄ ΤΑΞΕΩΣ" },
  { id: 5156, description: "ΙΑΤΡΟΔΙΚΑΣΤΗΣ Δ΄ ΤΑΞΕΩΣ" },
  { id: 23926, description: "ΙΕΡΕΑΣ" },
  { id: 117522, description: "ΙΕΡΟΚΗΡΥΚΑΣ" },
  { id: 5056, description: "ΙΚΑΡΟΙ" },
  { id: 9401, description: "ΚΑΘΗΓΗΤHΣ" },
  { id: 5225, description: "ΚΑΘΗΓΗΤΗΣ Α.Σ.ΠΑΙ.Τ.Ε. - ΒΑΘΜΙΔΑΣ Α΄" },
  { id: 5226, description: "ΚΑΘΗΓΗΤΗΣ Α.Σ.ΠΑΙ.Τ.Ε. - ΒΑΘΜΙΔΑΣ Β΄" },
  { id: 5227, description: "ΚΑΘΗΓΗΤΗΣ Α.Σ.ΠΑΙ.Τ.Ε. - ΒΑΘΜΙΔΑΣ Γ΄" },
  { id: 5189, description: "ΚΑΘΗΓΗΤΗΣ ΑΚΑΔΗΜΙΑΣ ΕΜΠΟΡΙΚΟΥ ΝΑΥΤΙΚΟΥ" },
  {
    id: 5192,
    description: "ΚΑΘΗΓΗΤΗΣ ΕΙΔΙΚΩΝ ΜΑΘΗΜΑΤΩΝ ΑΚΑΔΗΜΙΑΣ ΕΜΠΟΡΙΚΟΥ ΝΑΥΤΙΚΟΥ",
  },
  { id: 9412, description: "ΚΑΘΗΓΗΤΗΣ ΕΦΑΡΜΟΓΩΝ" },
  {
    id: 22805,
    description:
      "ΚΑΘΗΓΗΤΗΣ ΕΦΑΡΜΟΓΩΝ ΕΙΔΙΚΩΝ ΚΑΙ ΤΕΧΝΙΚΩΝ ΜΑΘΗΜΑΤΩΝ ΑΚΑΔΗΜΙΑΣ ΕΜΠΟΡΙΚΟΥ ΝΑΥΤΙΚΟΥ",
  },
  { id: 5215, description: "ΚΑΘΗΓΗΤΗΣ ΕΦΑΡΜΟΓΩΝ ΜΕΛΟΣ ΕΠ ΤΕΙ" },
  {
    id: 5204,
    description:
      "ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ  ΜΕ ΚΑΘΗΚΟΝΤΑ ΚΟΣΜΗΤΟΡΑ - ΠΡΟΕΔΡΟΥ ΤΜΗΜΑΤΟΣ",
  },
  { id: 5203, description: "ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ ΜΕ ΚΑΘΗΚΟΝΤΑ ΑΝΤΙΠΡΥΤΑΝΗ" },
  { id: 5202, description: "ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ ΜΕ ΚΑΘΗΚΟΝΤΑ ΠΡΥΤΑΝΗ" },
  { id: 5198, description: "ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΔΕΠ ΠΑΝΕΠΙΣΤΗΜΙΟΥ" },
  { id: 5212, description: "ΚΑΘΗΓΗΤΗΣ ΜΕΛΟΣ ΕΠ ΤΕΙ" },
  { id: 21099, description: "ΚΑΛΛΙΤΕΧΝΙΚΟΣ ΔΙΕΥΘΥΝΤΗΣ" },
  { id: 5035, description: "ΚΕΛΕΥΣΤΗΣ" },
  { id: 5087, description: "ΚΕΛΕΥΣΤΗΣ Λ.Σ." },
  { id: 9404, description: "ΛΕΚΤΟΡΑΣ" },
  { id: 82575, description: "ΛΕΚΤΟΡΑΣ ΕΦΑΡΜΟΓΩΝ" },
  { id: 5201, description: "ΛΕΚΤΟΡΑΣ ΜΕΛΟΣ ΔΕΠ ΠΑΝΕΠΙΣΤΗΜΙΟΥ" },
  { id: 5089, description: "ΛΙΜΕΝΟΦΥΛΑΚΑΣ Λ.Σ." },
  { id: 5011, description: "ΛΟΧΑΓΟΣ" },
  { id: 5017, description: "ΛΟΧΙΑΣ" },
  { id: 5019, description: "ΜΑΘΗΤΗΣ ΠΑΡΑΓΩΓΙΚΩΝ ΣΧΟΛΩΝ" },
  { id: 5038, description: "ΜΑΘΗΤΗΣ ΣΜΥΝ" },
  { id: 5037, description: "ΜΑΘΗΤΗΣ ΣΝΔ" },
  { id: 5208, description: "ΜΕΛΟΣ ΕΕΔΙΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Α΄" },
  { id: 5209, description: "ΜΕΛΟΣ ΕΕΔΙΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Β΄" },
  { id: 5210, description: "ΜΕΛΟΣ ΕΕΔΙΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Γ΄" },
  { id: 5211, description: "ΜΕΛΟΣ ΕΕΔΙΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Δ΄" },
  { id: 5216, description: "ΜΕΛΟΣ ΕΙΔΙΚΟΥ ΔΙΔΑΚΤΙΚΟΥ ΠΡΟΣΩΠΙΚΟΥ ΤΕΙ" },
  { id: 5195, description: "ΜΕΛΟΣ ΕΤΕΠ ΑΕΙ  ΒΑΘΜΙΔΑΣ Γ΄" },
  { id: 5193, description: "ΜΕΛΟΣ ΕΤΕΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Α΄" },
  { id: 5194, description: "ΜΕΛΟΣ ΕΤΕΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Β΄" },
  { id: 5196, description: "ΜΕΛΟΣ ΕΤΕΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Δ΄" },
  { id: 5197, description: "ΜΕΛΟΣ ΕΤΕΠ ΑΕΙ ΒΑΘΜΙΔΑΣ Ε΄" },
  { id: 5181, description: "ΜΗΤΡΟΠΟΛΙΤΗΣ" },
  { id: 5240, description: "ΜΟΝΙΜΟΣ ΠΑΡΕΔΡΟΣ ΠΑΙΔΑΓΩΓΙΚΟΥ ΙΝΣΤΙΤΟΥΤΟΥ" },
  { id: 117497, description: "ΜΟΝΙΜΟΣ ΣΤΡΑΤΙΩΤΗΣ/ΝΑΥΤΗΣ/ΣΜΗΝΙΤΗΣ" },
  { id: 5188, description: "ΜΟΥΣΙΚΟΣ" },
  { id: 5186, description: "ΜΟΥΣΙΚΟΣ ΚΟΡΥΦΑΙΟΣ Α΄" },
  { id: 5187, description: "ΜΟΥΣΙΚΟΣ ΚΟΡΥΦΑΙΟΣ Β΄" },
  { id: 5022, description: "ΝΑΥΑΡΧΟΣ" },
  { id: 21101, description: "ΝΑΥΤΗΣ" },
  { id: 117501, description: "ΝΑΥΤΙΚΟΣ ΔΟΚΙΜΟΣ" },
  { id: 117524, description: "ΝΟΜΙΚΟΣ ΣΥΜΒΟΥΛΟΣ" },
  { id: 5167, description: "ΝΟΜΙΚΟΣ ΣΥΜΒΟΥΛΟΣ Α" },
  { id: 5168, description: "ΝΟΜΙΚΟΣ ΣΥΜΒΟΥΛΟΣ Β" },
  { id: 23127, description: "ΝΟΜΙΚΟΣ ΣΥΜΒΟΥΛΟΣ ΤΟΥ ΚΡΑΤΟΥΣ" },
  { id: 82279, description: "ΝΟΣΟΚΟΜΕΙΑΚΩΝ ΦΑΡΜΑΚΟΠΟΙΩΝ Ε.Σ.Υ. ΔΙΕΥΘΥΝΤΗΣ" },
  { id: 82280, description: "ΝΟΣΟΚΟΜΕΙΑΚΩΝ ΦΑΡΜΑΚΟΠΟΙΩΝ Ε.Σ.Υ. ΕΠΙΜΕΛΗΤΗΣ Α΄" },
  { id: 82281, description: "ΝΟΣΟΚΟΜΕΙΑΚΩΝ ΦΑΡΜΑΚΟΠΟΙΩΝ Ε.Σ.Υ. ΕΠΙΜΕΛΗΤΗΣ Β΄" },
  { id: 82282, description: "ΝΟΣΟΚΟΜΕΙΑΚΩΝ ΦΑΡΜΑΚΟΠΟΙΩΝ Ε.Σ.Υ. ΕΠΙΜΕΛΗΤΗΣ Γ΄" },
  { id: 5270, description: "ΠΑΡΕΔΡΟΣ" },
  { id: 21102, description: "ΠΑΡΕΔΡΟΣ ΔΙΚΑΣΤΙΚΟΥ ΣΩΜΑΤΟΣ ΕΝΟΠΛΩΝ ΔΥΝΑΜΕΩΝ" },
  { id: 5142, description: "ΠΑΡΕΔΡΟΣ ΕΙΣΑΓΓΕΛΙΑΣ" },
  { id: 21103, description: "ΠΑΡΕΔΡΟΣ ΠΑΙΔΑΓΩΓΙΚΟΥ ΙΝΣΤΙΤΟΥΤΟΥ" },
  { id: 5141, description: "ΠΑΡΕΔΡΟΣ ΠΡΩΤΟΔΙΚΕΙΟΥ" },
  { id: 5143, description: "ΠΑΡΕΔΡΟΣ ΠΡΩΤΟΔΙΚΕΙΟΥ ΔΙΟΙΚΗΤΙΚΩΝ ΔΙΚΑΣΤΗΡΙΩΝ" },
  {
    id: 115338,
    description:
      "ΠΑΡΕΔΡΟΣ ΤΗΣ ΓΕΝΙΚΗΣ ΕΠΙΤΡΟΠΕΙΑΣ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ ΣΤΟ ΕΛΕΓΚΤΙΚΟ ΣΥΝΕΔΡΙΟ",
  },
  { id: 5127, description: "ΠΑΡΕΔΡΟΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  { id: 5124, description: "ΠΑΡΕΔΡΟΣ ΤΟΥ ΝΟΜΙΚΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΟΥ ΚΡΑΤΟΥΣ" },
  { id: 5149, description: "ΠΑΡΕΔΡΟΣ ΤΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ" },
  { id: 5164, description: "ΠΛΗΡΕΞΟΥΣΙΟΣ ΥΠΟΥΡΓΟΣ Α΄ ΤΑΞΕΩΣ" },
  { id: 5166, description: "ΠΛΗΡΕΞΟΥΣΙΟΣ ΥΠΟΥΡΓΟΣ Β΄ ΤΑΞΕΩΣ" },
  { id: 5026, description: "ΠΛΟΙΑΡΧΟΣ" },
  { id: 5078, description: "ΠΛΟΙΑΡΧΟΣ Λ.Σ." },
  { id: 5028, description: "ΠΛΩΤΑΡΧΗΣ" },
  { id: 5080, description: "ΠΛΩΤΑΡΧΗΣ Λ.Σ." },
  { id: 5163, description: "ΠΡΕΣΒΗΣ" },
  { id: 22888, description: "ΠΡΕΣΒΥΣ" },
  { id: 23925, description: "ΠΡΕΣΒΥΤΕΡΟΣ" },
  { id: 5121, description: "ΠΡΟΕΔΡΟΣ ΕΦΕΤΩΝ" },
  { id: 5123, description: "ΠΡΟΕΔΡΟΣ ΕΦΕΤΩΝ ΔΙΟΙΚΗΤΙΚΩΝ ΔΙΚΑΣΤΗΡΙΩΝ" },
  { id: 5129, description: "ΠΡΟΕΔΡΟΣ ΠΡΩΤΟΔΙΚΩΝ" },
  {
    id: 5130,
    description: "ΠΡΟΕΔΡΟΣ ΠΡΩΤΟΔΙΚΩΝ ΔΙΟΙΚΗΤΙΚΩΝ ΔΙΟΙΚΗΤΙΚΩΝ ΔΙΚΑΣΤΗΡΙΩΝ",
  },
  { id: 5105, description: "ΠΡΟΕΔΡΟΣ Σ.Τ.Ε." },
  { id: 5106, description: "ΠΡΟΕΔΡΟΣ ΤΟΥ ΑΡΕΙΟΥ ΠΑΓΟΥ" },
  { id: 5108, description: "ΠΡΟΕΔΡΟΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  { id: 5146, description: "ΠΡΟΕΔΡΟΣ ΤΟΥ ΝΟΜΙΚΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΟΥ ΚΡΑΤΟΥΣ" },
  { id: 117527, description: "ΠΡΟΕΔΡΟΣ ΤΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ" },
  { id: 117526, description: "ΠΡΟΪΣΤΑΜΕΝΟΣ ΝΟΜΙΚΗΣ ΥΠΗΡΕΣΙΑΣ" },
  { id: 21104, description: "ΠΡΟΞΕΝΟΣ" },
  { id: 5133, description: "ΠΡΩΤΟΔΙΚΗΣ" },
  { id: 5135, description: "ΠΡΩΤΟΔΙΚΗΣ ΔΙΟΙΚΗΤΙΚΩΝ ΔΙΚΑΣΤΗΡΙΩΝ" },
  { id: 117474, description: "ΠΡΩΤΟΔΙΚΗΣ ΕΙΔΙΚΗΣ ΕΠΕΤΗΡΙΔΑΣ" },
  { id: 21105, description: "ΠΡΩΤΟΠΡΕΣΒΥΤΕΡΟΣ" },
  { id: 21106, description: "ΠΡΩΤΟΣΥΓΚΕΛΛΟΣ" },
  { id: 5041, description: "ΠΤΕΡΑΡΧΟΣ" },
  { id: 5097, description: "ΠΥΡΑΓΟΣ Π.Σ" },
  { id: 5094, description: "ΠΥΡΑΡΧΟΣ Π.Σ" },
  { id: 5100, description: "ΠΥΡΟΝΟΜΟΣ Π.Σ" },
  { id: 117503, description: "ΠΥΡΟΣΒΕΣΤΗΣ ΕΠΙ ΘΗΤΕΙΑ (ΕΠΤΑΕΤΗ)" },
  { id: 5103, description: "ΠΥΡΟΣΒΕΣΤΗΣ Π.Σ" },
  { id: 23835, description: "ΠΥΡΟΣΒΕΣΤΗΣ ΠΕΝΤΑΕΤΟΥΣ ΥΠΟΧΡΕΩΣΗΣ" },
  { id: 5031, description: "ΣΗΜΑΙΟΦΟΡΟΣ" },
  { id: 5083, description: "ΣΗΜΑΙΟΦΟΡΟΣ Λ.Σ." },
  { id: 23633, description: "ΣΗΜΑΙΟΦΟΡΟΣ ΣΕΑ" },
  { id: 5048, description: "ΣΜΗΝΑΓΟΣ" },
  { id: 5045, description: "ΣΜΗΝΑΡΧΟΣ" },
  { id: 5054, description: "ΣΜΗΝΙΑΣ" },
  { id: 21107, description: "ΣΜΗΝΙΤΗΣ" },
  { id: 21100, description: "ΣΠΟΥΔΑΣΤΗΣ ΕΘΝΙΚΗΣ ΣΧΟΛΗΣ ΔΙΚΑΣΤΙΚΩΝ ΛΕΙΤΟΥΡΓΩΝ" },
  { id: 5266, description: "ΣΤ΄" },
  { id: 117500, description: "ΣΤΡΑΤΕΥΣΙΜΟΣ ΔΙΟΠΟΣ" },
  { id: 117499, description: "ΣΤΡΑΤΕΥΣΙΜΟΣ ΚΕΛΕΥΣΤΗΣ" },
  { id: 5004, description: "ΣΤΡΑΤΗΓΟΣ" },
  { id: 21108, description: "ΣΤΡΑΤΙΩΤΗΣ" },
  { id: 21109, description: "ΣΤΡΑΤΙΩΤΙΚΟΣ ΔΙΚΑΣΤΗΣ Α΄" },
  { id: 21110, description: "ΣΤΡΑΤΙΩΤΙΚΟΣ ΔΙΚΑΣΤΗΣ Β΄" },
  { id: 21111, description: "ΣΤΡΑΤΙΩΤΙΚΟΣ ΔΙΚΑΣΤΗΣ Γ΄" },
  { id: 21112, description: "ΣΤΡΑΤΙΩΤΙΚΟΣ ΔΙΚΑΣΤΗΣ Δ΄" },
  { id: 5245, description: "ΣΥΜΒΟΥΛΟΣ Α΄ Ο.Ε.Υ." },
  { id: 5247, description: "ΣΥΜΒΟΥΛΟΣ Β΄ Ο.Ε.Υ." },
  { id: 23219, description: "ΣΥΜΒΟΥΛΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ" },
  { id: 23220, description: "ΣΥΜΒΟΥΛΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Α'" },
  { id: 21113, description: "ΣΥΜΒΟΥΛΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Α΄" },
  { id: 23221, description: "ΣΥΜΒΟΥΛΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Β'" },
  { id: 21114, description: "ΣΥΜΒΟΥΛΟΣ ΕΠΙΚΟΙΝΩΝΙΑΣ Β΄" },
  { id: 5170, description: "ΣΥΜΒΟΥΛΟΣ ΠΡΕΣΒΕΙΑΣ Α΄ ΤΑΞΕΩΣ" },
  { id: 5173, description: "ΣΥΜΒΟΥΛΟΣ ΠΡΕΣΒΕΙΑΣ Β΄ ΤΑΞΕΩΣ" },
  { id: 5115, description: "ΣΥΜΒΟΥΛΟΣ ΤΗΣ ΕΠΙΚΡΑΤΕΙΑΣ" },
  { id: 5118, description: "ΣΥΜΒΟΥΛΟΣ ΤΟΥ ΕΛΕΓΚΤΙΚΟΥ ΣΥΝΕΔΡΙΟΥ" },
  {
    id: 5242,
    description: "ΣΥΜΒΟΥΛΟΣ ΤΟΥ ΙΝΣΤΙΤΟΥΤΟΥ ΤΕΧΝΟΛΟΓΙΚΗΣ ΕΚΠΑΙΔΕΥΣΗΣ",
  },
  { id: 5148, description: "ΣΥΜΒΟΥΛΟΣ ΤΟΥ ΝΟΜΙΚΟΥ ΣΥΜΒΟΥΛΙΟΥ ΤΟΥ ΚΡΑΤΟΥΣ" },
  { id: 5234, description: "ΣΥΝΕΡΓΑΤΗΣ Α΄" },
  { id: 5235, description: "ΣΥΝΕΡΓΑΤΗΣ Β΄" },
  { id: 5236, description: "ΣΥΝΕΡΓΑΤΗΣ Γ΄" },
  { id: 5237, description: "ΣΥΝΕΡΓΑΤΗΣ Δ΄" },
  { id: 5238, description: "ΣΥΝΕΡΓΑΤΗΣ Ε΄" },
  { id: 22676, description: "ΣΥΝΟΡΙΑΚΟΣ ΦΥΛΑΚΑΣ" },
  { id: 5008, description: "ΣΥΝΤΑΓΜΑΤΑΡΧΗΣ" },
  { id: 22929, description: "ΣΥΝΤΟΝΙΣΤΗΣ ΔΙΕΥΘΥΝΤΗΣ" },
  { id: 23016, description: "ΣΥΝΤΟΝΙΣΤΗΣ ΔΙΕΥΘΥΝΤΗΣ ΙΑΤΡΟΣ Ε.Σ.Υ." },
  { id: 5010, description: "ΤΑΓΜΑΤΑΡΧΗΣ" },
  {
    id: 5239,
    description: "ΤΑΚΤΙΚΟΣ ΚΑΘΗΓΗΤΗΣ ΤΗΣ ΕΘΝΙΚΗΣ ΣΧΟΛΗΣ ΔΗΜΟΣΙΑΣ ΔΙΟΙΚΗΣΗΣ",
  },
  { id: 5007, description: "ΤΑΞΙΑΡΧΟΣ" },
  { id: 5253, description: "ΤΑΞΙΝΟΜΟΣ" },
  { id: 22890, description: "ΤΕ1" },
  { id: 22891, description: "ΤΕ2" },
  { id: 22892, description: "ΤΕ3" },
  { id: 22893, description: "ΤΕ4" },
  { id: 22894, description: "ΤΕ5" },
  { id: 22895, description: "ΤΕ6" },
  { id: 22896, description: "ΤΕ7" },
  { id: 22897, description: "ΤΕ8" },
  { id: 5183, description: "ΤΙΤΟΥΛΑΡΙΟΣ ΕΠΙΣΚΟΠΟΣ" },
  { id: 5182, description: "ΤΙΤΟΥΛΑΡΙΟΣ ΜΗΤΡΟΠΟΛΙΤΗΣ" },
  { id: 21115, description: "ΤΜΗΜΑΤΑΡΧΗΣ" },
  { id: 114442, description: "ΤΜΗΜΑΤΑΡΧΗΣ Α΄" },
  { id: 114443, description: "ΤΜΗΜΑΤΑΡΧΗΣ Β΄" },
  { id: 21116, description: "ΤΟΜΕΑΡΧΗΣ" },
  { id: 5102, description: "ΥΠΑΡΧΙΠΥΡΟΣΒΕΣΤΗΣ Π.Σ" },
  { id: 5070, description: "ΥΠΑΡΧΙΦΥΛΑΚΑΣ" },
  { id: 5066, description: "ΥΠΑΣΤΥΝΟΜΟΣ Α΄" },
  { id: 5067, description: "ΥΠΑΣΤΥΝΟΜΟΣ Β΄" },
  { id: 21117, description: "ΥΠΙΛΑΡΧΟΣ" },
  { id: 21118, description: "ΥΠΟΔΕΚΑΝΕΑΣ" },
  { id: 5088, description: "ΥΠΟΚΕΛΕΥΣΤΗΣ Λ.Σ." },
  { id: 5012, description: "ΥΠΟΛΟΧΑΓΟΣ" },
  { id: 5024, description: "ΥΠΟΝΑΥΑΡΧΟΣ" },
  { id: 5076, description: "ΥΠΟΝΑΥΑΡΧΟΣ Λ.Σ." },
  { id: 5029, description: "ΥΠΟΠΛΟΙΑΡΧΟΣ" },
  { id: 5081, description: "ΥΠΟΠΛΟΙΑΡΧΟΣ Λ.Σ." },
  { id: 5043, description: "ΥΠΟΠΤΕΡΑΡΧΟΣ" },
  { id: 5098, description: "ΥΠΟΠΥΡΑΓΟΣ Π.Σ" },
  { id: 5049, description: "ΥΠΟΣΜΗΝΑΓΟΣ" },
  { id: 5055, description: "ΥΠΟΣΜΗΝΙΑΣ" },
  { id: 5006, description: "ΥΠΟΣΤΡΑΤΗΓΟΣ" },
  { id: 5092, description: "ΥΠΟΣΤΡΑΤΗΓΟΣ Π.Σ." },
  {
    id: 5271,
    description: "ΥΠΟΧΡΕΟΙ ΠΟΥ ΔΕΝ ΕΝΤΑΣΣΟΝΤΑΙ Η ΔΕΝ ΕΧΟΥΝ ΕΝΤΑΧΘΕΙ ΣΕ ΒΑΘΜΟ",
  },
  { id: 22804, description: "ΦΡΟΥΡΟΣ" },
];

const ranksMap = new Map<number, string>(
  RANKS_DATA.map((rank) => [rank.id, rank.description])
);

export const getRankDescription = (
  code: number | string | undefined | null
): string => {
  if (code === null || code === undefined || code === "") {
    return "-";
  }

  const id = Number(code);

  if (isNaN(id)) {
    return "-";
  }

  return ranksMap.get(id) || `Άγνωστος Κωδικός (${code})`;
};

export interface EmploymentTypeDto {
  id: number;
  description: string;
}

export const EMPLOYMENT_TYPES_DATA: EmploymentTypeDto[] = [
  { id: 6, description: "ΑΙΡΕΤΟΙ" },
  { id: 24, description: "ΑΝΤΙΡΡΗΣΙΕΣ ΣΥΝΕΙΔΗΣΗΣ" },
  {
    id: 34,
    description:
      "ΑΠΑΣΧΟΛΟΥΜΕΝΟΙ ΜΕ ΠΡΟΣΩΡΙΝΗ ΔΙΑΤΑΓΗ/ΑΣΦΑΛΙΣΤΙΚΑ ΜΕΤΡΑ/ΠΡΟΣΩΡΙΝΑ ΕΚΤΕΛΕΣΤΗ ΔΙΚ.ΑΠΟΦΑΣΗ",
  },
  { id: 23, description: "ΑΠΟΣΠΑΣΜΕΝΟΙ ΑΠΟ Ν.Π.Ι.Δ." },
  { id: 13, description: "ΒΟΥΛΕΥΤΕΣ - ΕΥΡΩΒΟΥΛΕΥΤΕΣ" },
  { id: 28, description: "ΔΙΚΑΙΟΥΧΟΙ ΑΠΟΖΗΜΙΩΣΕΩΝ ΜΕ ΔΙΚΑΣΤΙΚΗ ΑΠΟΦΑΣΗ" },
  { id: 100, description: "ΕΚΠΑΙΔΕΥΤΕΣ ΣΧΟΛΩΝ ΕΠΙΜΟΡΦΩΣΗΣ ΔΗΜΟΣΙΟΥ" },
  { id: 10, description: "ΕΜΜΙΣΘΗ ΕΝΤΟΛΗ" },
  { id: 11, description: "ΕΠΙ ΘΗΤΕΙΑ" },
  {
    id: 30,
    description: "ΕΠΙ ΘΗΤΕΙΑ / ΒΑΘΜΙΔΑ ΛΕΚΤΟΡΑ – ΕΠΙΚΟΥΡΟΥ (Ν.4009/2011)",
  },
  { id: 32, description: "ΕΠΙ ΘΗΤΕΙΑ / ΕΙΔΙΚΟΙ ΦΡΟΥΡΟΙ (Ν.3181/2003) & ΒΤΕ" },
  { id: 122, description: "ΕΠΙ ΘΗΤΕΙΑ / ΕΠΑΓΓΕΛΜΑΤΙΕΣ ΟΠΛΙΤΕΣ" },
  { id: 31, description: "ΕΠΙ ΘΗΤΕΙΑ / ΙΑΤΡΟΙ ΕΣΥ (Ν.3754/2009)" },
  { id: 33, description: "ΕΠΙ ΘΗΤΕΙΑ / ΠΥΡΟΣΒΕΣΤΕΣ" },
  { id: 123, description: "ΕΠΙ ΘΗΤΕΙΑ / ΠΥΡΟΣΒΕΣΤΕΣ ΔΑΣΙΚΩΝ ΕΠΙΧΕΙΡΗΣΕΩΝ" },
  { id: 101, description: "ΕΠΙ ΘΗΤΕΙΑ / ΣΥΝΟΡΙΑΚΟΙ ΦΥΛΑΚΕΣ" },
  { id: 26, description: "ΕΠΙΣΤΗΜΟΝΙΚΟΙ ΣΥΝΕΡΓΑΤΕΣ ΒΟΥΛΕΥΤΩΝ" },
  { id: 25, description: "ΘΕΡΑΠΑΙΝΙΔΕΣ ΥΕΘΑ" },
  { id: 9, description: "ΙΔΙΩΤΕΣ ΜΕΛΗ ΕΠΙΤΡΟΠΩΝ" },
  { id: 3, description: "ΙΔΙΩΤΙΚΟΥ ΔΙΚΑΙΟΥ ΑΟΡΙΣΤΟΥ ΧΡΟΝΟΥ" },
  { id: 2, description: "ΙΔΙΩΤΙΚΟΥ ΔΙΚΑΙΟΥ ΟΡΙΣΜΕΝΟΥ ΧΡΟΝΟΥ" },
  {
    id: 35,
    description:
      "ΙΔΙΩΤΙΚΟΥ ΔΙΚΑΙΟΥ ΟΡΙΣΜΕΝΟΥ ΧΡΟΝΟΥ /ΧΡΗΜΑΤΟΔΟΤΟΥΜΕΝΑ ΜΕΣΩ ΕΣΠΑ/ΑΝΤΑΠΟΔΟΤΙΚΑ/ΜΕΣΩ ΑΝΤΙΤΙΜΟΥ",
  },
  {
    id: 40,
    description: "ΙΔΙΩΤΙΚΟΥ ΔΙΚΑΙΟΥ ΟΡΙΣΜΕΝΟΥ ΧΡΟΝΟΥ/ΠΡΟΓΡΑΜΜΑΤΑ ΔΥΠΑ",
  },
  {
    id: 1,
    description:
      "ΜOΝΙΜΟΙ ΥΠAΛΛΗΛΟΙ ΤΟΥ ΔΗΜΟΣIΟΥ /ΔΙΚΑΣΤΙΚΟI ΛΕΙΤΟΥΡΓΟI /ΔΗΜOΣΙΟΙ ΛΕΙΤΟΥΡΓΟI",
  },
  { id: 21, description: "ΜΕΛΗ ΤΗΣ ΚΥΒΕΡΝΗΣΗΣ / ΥΦΥΠΟΥΡΓΟΙ" },
  {
    id: 5,
    description:
      "ΜΕΤΑΚΛΗΤΟΙ / ΕΙΔΙΚΟΙ ΣΥΜΒΟΥΛΟΙ / ΕΙΔΙΚΟΙ ΣΥΝΕΡΓΑΤΕΣ / ΕΠΙΣΤΗΜΟΝΙΚΟΙ ΣΥΝΕΡΓΑΤΕΣ",
  },
  { id: 90, description: "ΠΙΣΤΟΠΟΙΗΜΕΝΟΣ ΧΡΗΣΤΗΣ ΑΠΟΓΡΑΦΗΣ" },
  {
    id: 22,
    description: "ΠΡΑΚΤΙΚΗ ΑΣΚΗΣΗ / ΜΑΘΗΤΕΙΑ / ΕΠΑΓΓΕΛΜΑΤΙΚΗ ΚΑΤΑΡΤΙΣΗ",
  },
  {
    id: 38,
    description: "ΠΡΟΕΔΡΟΙ / ΜΕΛΗ ΔΙΟΙΚΗΤΙΚΩΝ ΣΥΜΒΟΥΛΙΩΝ / ΟΡΓΑΝΑ ΔΙΟΙΚΗΣΗΣ",
  },
  { id: 39, description: "ΣΥΜΒΑΣΗ ΑΝΕΞΑΡΤΗΤΩΝ ΥΠΗΡΕΣΙΩΝ" },
  { id: 8, description: "ΣΥΜΒΑΣΙΟΥΧΟΙ ΕΡΓΟΥ" },
  {
    id: 37,
    description:
      "ΣΥΜΒΑΣΙΟΥΧΟΙ ΕΡΓΟΥ /ΧΡΗΜΑΤΟΔΟΤΟΥΜΕΝΑ ΜΕΣΩ ΕΣΠΑ Η ΑΠΟ ΙΔΙΟΥΣ ΠΟΡΟΥΣ",
  },
  { id: 29, description: "ΣΧΟΛΙΚΟΙ ΤΡΟΧΟΝΟΜΟΙ" },
  { id: 27, description: "ΥΠΟΤΡΟΦΟΙ" },
  { id: 4, description: "ΩΡΟΜΙΣΘΙΟΙ/ΗΜΕΡΟΜΙΣΘΙΟΙ" },
  {
    id: 36,
    description:
      "ΩΡΟΜΙΣΘΙΟΙ/ΗΜΕΡΟΜΙΣΘΙΟΙ /ΧΡΗΜΑΤΟΔΟΤΟΥΜΕΝΑ ΜΕΣΩ ΕΣΠΑ/ΑΝΤΑΠΟΔΟΤΙΚΑ/ΜΕΣΩ ΑΝΤΙΤΙΜΟΥ",
  },
];

const employmentTypesMap = new Map<number, string>(
  EMPLOYMENT_TYPES_DATA.map((type) => [type.id, type.description])
);

export const getEmploymentTypeDescription = (
  code: number | string | undefined | null
): string => {
  if (code === null || code === undefined || code === "") {
    return "-";
  }

  const id = Number(code);

  if (isNaN(id)) {
    return "-";
  }

  return employmentTypesMap.get(id) || `Άγνωστος Τύπος (${code})`;
};

export interface EmployeeCategoryDto {
  id: number;
  description: string;
}

export const EMPLOYEE_CATEGORIES_DATA: EmployeeCategoryDto[] = [
  { id: 33, description: "ΑΙΡΕΤΟΙ ΟΤΑ Α ΚΑΙ Β ΒΑΘΜΟΥ" },
  { id: 23, description: "ΑΝΑΠΛΗΡΩΤΕΣ ΕΚΠΑΙΔΕΥΤΙΚΟΙ" },
  { id: 41, description: "ΑΝΤΙΡΡΗΣΙΕΣ ΣΥΝΕΙΔΗΣΗΣ" },
  { id: 72, description: "ΑΠΑΣΧΟΛΟΥΜΕΝΟΙ ΜΕ ΣΥΜΒΑΣΗ ΑΝΕΞΑΡΤΗΤΩΝ ΥΠΗΡΕΣΙΩΝ" },
  {
    id: 40,
    description: "ΑΠΟΣΠΑΣΜΕΝΟΙ ΑΠΟ Ν.Π.Ι.Δ. ΠΟΥ ΔΕΝ ΥΠΟΚΕΙΝΤΑΙ ΣΕ ΑΠΟΓΡΑΦΗ",
  },
  { id: 45, description: "ΔΕΝ ΕΧΕΙ ΟΡΙΣΤΕΙ Η ΚΑΤΗΓΟΡΙΑ ΠΡΟΣΩΠΙΚΟΥ" },
  { id: 51, description: "ΔΗΜΟΣΙΟΓΡΑΦΟΙ" },
  {
    id: 9,
    description:
      "ΔΙΔΑΚΤΙΚΟ ΚΑΙ ΕΙΔΙΚΟ ΔΙΔΑΚΤΙΚΟ ΠΡΟΣΩΠΙΚΟ ΑΝΩΤΑΤΩΝ ΕΚΚΛΗΣΙΑΣΤΙΚΩΝ ΑΚΑΔΗΜΙΩΝ",
  },
  { id: 44, description: "ΔΙΚΑΙΟΥΧΟΙ ΑΠΟΖΗΜΙΩΣΕΩΝ ΜΕ ΔΙΚΑΣΤΙΚΗ ΑΠΟΦΑΣΗ" },
  { id: 18, description: "ΔΙΚΑΣΤΕΣ" },
  { id: 56, description: "ΔΙΚΑΣΤΙΚΟΙ ΥΠΑΛΛΗΛΟΙ" },
  { id: 20, description: "ΔΙΠΛΩΜΑΤΙΚΟΙ ΥΠΑΛΛΗΛΟΙ" },
  { id: 29, description: "ΕΙΔΙΚΕΥΟΜΕΝΟΙ ΙΑΤΡΟΙ" },
  { id: 92, description: "ΕΙΔΙΚΕΥΟΜΕΝΟΙ ΝΟΣΗΛΕΥΤΕΣ" },
  { id: 61, description: "ΕΚΚΛΗΣΙΑΣΤΙΚΟΙ ΥΠΑΛΛΗΛΟΙ" },
  { id: 3, description: "ΕΚΠΑΙΔΕΥΤΙΚΟ ΠΡΟΣΩΠΙΚΟ ΔΕΥΤΕΡΟΒΑΘΜΙΑΣ ΕΚΠΑΙΔΕΥΣΗΣ" },
  { id: 47, description: "ΕΚΠΑΙΔΕΥΤΙΚΟ ΠΡΟΣΩΠΙΚΟ ΕΙΔΙΚΗΣ ΑΓΩΓΗΣ" },
  {
    id: 10,
    description:
      "ΕΚΠΑΙΔΕΥΤΙΚΟ ΠΡΟΣΩΠΙΚΟ ΚΑΙ ΕΙΔΙΚΟ ΕΚΠΑΙΔΕΥΤΙΚΟ ΠΡΟΣΩΠΙΚΟ ΑΚΑΔΗΜΙΩΝ ΕΜΠΟΡΙΚΟΥ ΝΑΥΤΙΚΟΥ",
  },
  { id: 2, description: "ΕΚΠΑΙΔΕΥΤΙΚΟ ΠΡΟΣΩΠΙΚΟ ΠΡΩΤΟΒΑΘΜΙΑΣ ΕΚΠΑΙΔΕΥΣΗΣ" },
  { id: 12, description: "ΕΛΕΓΚΤΕΣ ΙΑΤΡΟΙ" },
  { id: 19, description: "ΕΜΜΙΣΘΗ ΕΝΤΟΛΗ" },
  { id: 94, description: "ΕΝΤΕΤΑΛΜΕΝΟΙ ΔΙΔΑΣΚΟΝΤΕΣ ΑΡΘΡΟ 173 Ν. 4957/2022" },
  { id: 28, description: "ΕΠΙΚΟΥΡΙΚΟΙ ΙΑΤΡΟΙ" },
  { id: 63, description: "ΕΠΙΣΤΗΜΟΝΙΚΟΙ ΣΥΝΕΡΓΑΤΕΣ ΒΟΥΛΕΥΤΩΝ / ΕΥΡΩΒΟΥΛΕΥΤΩΝ" },
  { id: 66, description: "ΕΠΙΣΤΗΜΟΝΙΚΟΙ ΣΥΝΕΡΓΑΤΕΣ ΠΑΝΕΠΙΣΤΗΜΙΩΝ" },
  {
    id: 5,
    description: "ΕΡΕΥΝΗΤΕΣ / ΕΙΔΙΚΟΙ ΛΕΙΤΟΥΡΓΙΚΟΙ ΕΠΙΣΤΗΜΟΝΕΣ (Ε.Λ.Ε.)",
  },
  { id: 42, description: "ΘΕΡΑΠΑΙΝΙΔΕΣ ΥΕΘΑ" },
  { id: 93, description: "ΘΡΗΣΚΕΥΤΙΚΟΙ ΛΕΙΤΟΥΡΓΟΙ ΓΝΩΣΤΩΝ ΘΡΗΣΚΕΙΩΝ" },
  { id: 13, description: "ΙΑΤΡΟΔΙΚΑΣΤΕΣ" },
  { id: 11, description: "ΙΑΤΡΟΙ Ε.Σ.Υ" },
  { id: 37, description: "ΙΔΙΩΤΕΣ ΜΕΛΗ ΕΠΙΤΡΟΠΩΝ" },
  { id: 71, description: "ΚΑΛΛΙΤΕΧΝΙΚΟ ΠΡΟΣΩΠΙΚΟ (ΕΚΤΑΚΤΟ)" },
  { id: 70, description: "ΚΑΛΛΙΤΕΧΝΙΚΟ ΠΡΟΣΩΠΙΚΟ (ΤΑΚΤΙΚΟ)" },
  { id: 17, description: "ΚΛΗΡΙΚΟΙ" },
  { id: 36, description: "ΚΥΒΕΡΝΗΤΙΚΑ ΚΑΙ ΠΟΛΙΤΕΙΑΚΑ ΟΡΓΑΝΑ" },
  { id: 50, description: "ΚΥΡΙΟ ΠΡΟΣΩΠΙΚΟ Ν.Σ.Κ." },
  { id: 27, description: "ΛΟΙΠΟ ΕΚΤΑΚΤΟ ΠΡΟΣΩΠΙΚΟ" },
  { id: 60, description: "ΜΕΛΗ ΑΚΑΔΗΜΙΑΣ ΑΘΗΝΩΝ" },
  { id: 6, description: "ΜΕΛΗ ΔΕΠ" },
  { id: 7, description: "ΜΕΛΗ Ε.ΔΙ.Π / Ε.Ε.Δ.Ι.Π./ Ε.Ε.Π / Ε.Τ.Ε.Π." },
  {
    id: 34,
    description:
      "ΜΕΤΑΚΛΗΤΟΙ / ΕΙΔΙΚΟΙ ΣΥΜΒΟΥΛΟΙ / ΕΙΔΙΚΟΙ ΣΥΝΕΡΓΑΤΕΣ / ΕΠΙΣΤΗΜΟΝΙΚΟΙ ΣΥΝΕΡΓΑΤΕΣ",
  },
  { id: 4, description: "ΝΟΣΗΛΕΥΤΙΚΟ ΠΡΟΣΩΠΙΚΟ" },
  {
    id: 35,
    description: "ΟΡΓΑΝΑ ΔΙΟΙΚΗΣΗΣ ΝΟΜΙΚΩΝ ΠΡΟΣΩΠΩΝ ΚΑΙ ΑΝΕΞΑΡΤΗΤΩΝ ΑΡΧΩΝ",
  },
  { id: 90, description: "ΠΙΣΤΟΠΟΙΗΜΕΝΟΣ ΧΡΗΣΤΗΣ ΑΠΟΓΡΑΦΗΣ" },
  { id: 1, description: "ΠΟΛΙΤΙΚΟ ΠΡΟΣΩΠΙΚΟ" },
  { id: 38, description: "ΠΡΑΚΤΙΚΗ ΑΣΚΗΣΗ/ΜΑΘΗΤΕΙΑ" },
  { id: 21, description: "ΠΡΕΣΒΕΙΣ ΕΚ ΠΡΟΣΩΠΙΚΟΤΗΤΩΝ" },
  {
    id: 26,
    description:
      "ΠΡΟΣΛΑΜΒΑΝΟΜΕΝΟΙ ΓΙΑ ΑΝΤΙΜΕΤΩΠΙΣΗ ΕΠΟΧΙΚΩΝ/ ΠΕΡΙΟΔΙΚΩΝ/ΠΡΟΣΚΑΙΡΩΝ ΑΝΑΓΚΩΝ ΑΡ.37 Ν.4765/2021",
  },
  { id: 69, description: "ΠΡΟΣΛΑΜΒΑΝΟΜΕΝΟΙ ΓΙΑ ΑΝΤΙΜΕΤΩΠΙΣΗ ΚΟΡΩΝΟΪΟΥ" },
  {
    id: 67,
    description:
      "ΠΡΟΣΛΑΜΒΑΝΟΜΕΝΟΙ ΓΙΑ ΑΝΤΙΜΕΤΩΠΙΣΗ ΠΡΟΣΦΥΓΙΚΩΝ / ΜΕΤΑΝΑΣΤΕΥΤΙΚΩΝ ΡΟΩΝ",
  },
  {
    id: 68,
    description:
      "ΠΡΟΣΛΑΜΒΑΝΟΜΕΝΟΙ ΓΙΑ ΚΑΛΥΨΗ ΑΠΡΟΒΛΕΠΤΩΝ / ΕΠΕΙΓΟΥΣΩΝ ΑΝΑΓΚΩΝ ΑΡ.36 Ν.4765/2021",
  },
  {
    id: 25,
    description: "ΠΡΟΣΛΑΜΒΑΝΟΜΕΝΟΙ ΜΕ ΑΡ.41 §2 Ν.4325/2015 (ΕΩΣ 3 ΜΗΝΕΣ)",
  },
  { id: 24, description: "ΠΡΟΣΛΑΜΒΑΝΟΜΕΝΟΙ ΜΕΣΩ ΠΡΟΓΡΑΜΜΑΤΩΝ ΔΥΠΑ" },
  { id: 15, description: "ΣΠΟΥΔΑΣΤΕΣ ΠΑΡΑΓΩΓΙΚΩΝ ΣΧΟΛΩΝ ΔΗΜΟΣΙΟΥ" },
  { id: 16, description: "ΣΤΕΛΕΧΗ ΣΩΜΑΤΩΝ ΑΣΦΑΛΕΙΑΣ" },
  { id: 14, description: "ΣΤΡΑΤΙΩΤΙΚΟΙ" },
  { id: 43, description: "ΥΠΟΤΡΟΦΟΙ" },
  { id: 30, description: "ΥΠΟΧΡΕΟΙ ΠΡΟΣΩΠΙΚΟΙ ΙΑΤΡΟΙ" },
  { id: 65, description: "ΩΡΟΜΙΣΘΙΟΙ ΕΚΠΑΙΔΕΥΤΙΚΟΙ" },
];

const employeeCategoriesMap = new Map<number, string>(
  EMPLOYEE_CATEGORIES_DATA.map((cat) => [cat.id, cat.description])
);

export const getEmployeeCategoryDescription = (
  code: number | string | undefined | null
): string => {
  if (code === null || code === undefined || code === "") {
    return "-";
  }

  const id = Number(code);

  if (isNaN(id)) {
    return "-";
  }

  return employeeCategoriesMap.get(id) || `Άγνωστη Κατηγορία (${code})`;
};