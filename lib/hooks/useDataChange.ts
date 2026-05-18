"use client";

import { useEffect } from "react";
import { subscribeDataChange, type DataDomain } from "@/lib/dataEvents";

/**
 * Hook React qui appelle `handler` chaque fois qu'un evenement de changement
 * de donnees est emis pour les domaines surveilles.
 *
 * Permet aussi le refetch automatique au focus de la fenetre (utile quand
 * l'utilisateur change d'onglet et revient sur le dashboard).
 */
export function useDataChange(
  domains: DataDomain | DataDomain[],
  handler: () => void,
  options: { refetchOnFocus?: boolean } = {},
) {
  const { refetchOnFocus = true } = options;

  useEffect(() => {
    const unsubscribe = subscribeDataChange(domains, () => handler());

    let focusHandler: (() => void) | null = null;
    if (refetchOnFocus && typeof window !== "undefined") {
      focusHandler = () => handler();
      window.addEventListener("focus", focusHandler);
    }

    return () => {
      unsubscribe();
      if (focusHandler && typeof window !== "undefined") {
        window.removeEventListener("focus", focusHandler);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
