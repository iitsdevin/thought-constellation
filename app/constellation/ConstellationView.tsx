"use client";

import { useEffect, useMemo, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphPayload } from "@/types/models";

function layoutNodes(payload: GraphPayload): Node[] {
  const centreX = 520;
  const centreY = 320;
  const categoryRadius = 220;
  const noteRadius = 360;
  const categories = payload.nodes.filter((node) => node.type === "category");
  const notes = payload.nodes.filter((node) => node.type === "note");

  return [
    ...categories.map((node, index) => {
      const angle = (index / Math.max(categories.length, 1)) * Math.PI * 2;
      return {
        id: node.id,
        data: { label: node.label },
        position: {
          x: centreX + Math.cos(angle) * categoryRadius,
          y: centreY + Math.sin(angle) * categoryRadius
        },
        style: {
          border: "1px solid #42372e",
          borderRadius: 22,
          fontWeight: 800,
          padding: 12,
          width: 190
        }
      } satisfies Node;
    }),
    ...notes.map((node, index) => {
      const angle = (index / Math.max(notes.length, 1)) * Math.PI * 2;
      return {
        id: node.id,
        data: { label: node.label },
        position: {
          x: centreX + Math.cos(angle) * noteRadius,
          y: centreY + Math.sin(angle) * noteRadius
        },
        style: {
          border: "1px solid #ded4c6",
          borderRadius: 18,
          padding: 10,
          width: 170
        }
      } satisfies Node;
    })
  ];
}

export default function ConstellationView() {
  const [payload, setPayload] = useState<GraphPayload>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGraph() {
      try {
        const response = await fetch("/api/constellation", { cache: "no-store" });
        const graph = await response.json();
        if (!response.ok) throw new Error(graph.error ?? "Could not load constellation.");
        setPayload(graph);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load constellation.");
      } finally {
        setIsLoading(false);
      }
    }

    loadGraph();
  }, []);

  const nodes = useMemo(() => layoutNodes(payload), [payload]);
  const edges: Edge[] = useMemo(
    () =>
      payload.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label ?? undefined,
        animated: edge.label === "belongs to"
      })),
    [payload.edges]
  );

  if (isLoading) return <p>Loading constellation…</p>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="graph-shell">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
}
