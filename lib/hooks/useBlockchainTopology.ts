"use client";

import { useState, useEffect } from "react";

export interface TopologyNode {
  id: string;
  group: number;
  val: number;
  label?: string;
  address?: string;
  txCount?: number;
}

export interface TopologyLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface TopologyStats {
  totalValidators: number;
  totalTransactions: number;
  totalCommunes: number;
  blockNumber: string;
  source: string;
}

export function useBlockchainTopology() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [stats, setStats] = useState<TopologyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopology() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/blockchain/topology");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        // Always set graph data (even on failure the API returns fallback nodes)
        if (result.data) {
          setGraphData(result.data);
        }

        if (!result.success) {
          setError(result.error || "Erreur de connexion au réseau");
          return;
        }

        if (result.stats) {
          setStats(result.stats);
        }
      } catch (err: any) {
        console.error("Erreur blockchain topology:", err);
        setError(err?.message || "Impossible de charger la topologie");
        setGraphData({
          nodes: [{ id: "contract", group: 1, val: 30, label: "Smart Contract" }],
          links: [],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTopology();
  }, []);

  return { graphData, stats, loading, error };
}
