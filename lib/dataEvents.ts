"use client";


/**
 * Event bus simple pour invalider les caches et rafraichir les vues
 * entre pages quand une donnee change (signalement, certification, transaction, etc.).
 *
 * Usage :
 *   import { emitDataChange, useDataChange } from "@/lib/dataEvents";
 *
 *   // Apres une action API reussie :
 *   emitDataChange("signalement");
 *
 *   // Dans un composant qui doit refetch :
 *   useDataChange("signalement", () => fetchSignalements());
 */

export type DataDomain =
  | "signalement"
  | "certification"
  | "transaction"
  | "notification"
  | "engagement"
  | "commune"
  | "all";

const EVENT_NAME = "komoe:data-changed";

function getBus(): EventTarget | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  if (!w.__komoe_data_bus__) {
    w.__komoe_data_bus__ = new EventTarget();
  }
  return w.__komoe_data_bus__ as EventTarget;
}

/** Invalide tous les caches localStorage lies a un domaine. */
function clearCachesFor(domain: DataDomain) {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (domain === "all" || key.includes(`komoe_${domain}`) || key.includes(`komoe_${domain}s`)) {
      keys.push(key);
    }
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

/**
 * Emet un evenement de changement de donnees + invalide les caches localStorage lies.
 * Tous les composants abonnes via useDataChange seront notifies.
 */
export function emitDataChange(domain: DataDomain) {
  clearCachesFor(domain);
  const bus = getBus();
  if (!bus) return;
  bus.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { domain, ts: Date.now() } }));
}

/** Abonne un handler aux changements de donnees pour un ou plusieurs domaines. */
export function subscribeDataChange(
  domains: DataDomain[] | DataDomain,
  handler: (domain: DataDomain) => void,
): () => void {
  const bus = getBus();
  if (!bus) return () => {};
  const watched = Array.isArray(domains) ? domains : [domains];
  const listener = (e: Event) => {
    const ce = e as CustomEvent<{ domain: DataDomain }>;
    if (watched.includes("all") || watched.includes(ce.detail.domain) || ce.detail.domain === "all") {
      handler(ce.detail.domain);
    }
  };
  bus.addEventListener(EVENT_NAME, listener);
  return () => bus.removeEventListener(EVENT_NAME, listener);
}
