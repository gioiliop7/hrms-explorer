"use client";

import { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { Building2 } from "lucide-react";
import type { OrgmaMonadaTreeDto } from "@/types/api";
import { treeToFlow } from "@/lib/utils";

interface FlowDiagramProps {
  tree: OrgmaMonadaTreeDto;
  onSelectUnit: (unitCode: string) => void;
}

/* -------------------- */
/* Custom Node */
/* -------------------- */
function CustomNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4 min-w-[200px] text-center">
      {/* incoming edge */}
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />

      <div className="flex items-center justify-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-blue-600" />
        <div className="font-semibold text-sm text-gray-900 leading-tight">
          {data.label}
        </div>
      </div>

      <div className="text-xs text-gray-500">{data.code}</div>

      {/* outgoing edge */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500"
      />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

/* -------------------- */
/* Dagre Layout Helper */
/* -------------------- */
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  dagreGraph.setGraph({
    rankdir: "TB", // Top -> Bottom
    nodesep: 50,
    ranksep: 100,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: 200,
      height: 90,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: x - 100,
        y: y - 45,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });

  return { nodes: layoutedNodes, edges };
}

/* -------------------- */
/* Component */
/* -------------------- */
export default function FlowDiagram({ tree, onSelectUnit }: FlowDiagramProps) {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const flow = treeToFlow(tree);

    const styledEdges: Edge[] = flow.edges.map((edge) => ({
      ...edge,
      type: "smoothstep",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#3b82f6",
      },
      style: {
        stroke: "#3b82f6",
        strokeWidth: 2,
      },
    }));

    return getLayoutedElements(flow.nodes, styledEdges);
  }, [tree]);

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      onSelectUnit(node.data.code);
    },
    [onSelectUnit]
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px]">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Οργανόγραμμα (Δέντρο)
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Κάντε κλικ σε μια μονάδα για λεπτομέρειες
        </p>
      </div>

      <div className="h-[calc(100%-80px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          attributionPosition="bottom-left"
        >
          <Background gap={16} color="#e5e7eb" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
