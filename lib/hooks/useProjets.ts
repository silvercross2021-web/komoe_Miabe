"use client";

import { useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

export interface Projet {
  id: string;
  commune: number;
  commune_nom: string;
  nom: string;
  description: string;
  budget_alloue_fcfa: number;
  taux_execution: number;
  statut: string;
  bailleur: string;
  bailleur_nom: string;
  created_at: string;
}

export function useProjets(communeId?: number) {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/communes/projets/`);
      if (communeId) {
        url.searchParams.append('commune', communeId.toString());
      }

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erreur lors de la récupération des projets");
      }
      
      const data = await res.json();
      setProjets(data.results ?? (Array.isArray(data) ? data : []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [communeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { projets, loading, error, refetch: fetchData };
}
