// ─────────────────────────────────────────────────────────────────────────────
// KOMOE — Types TypeScript globaux
// Réseau blockchain : Polygon (PoS) — Amoy Testnet (Chain ID : 80002)
// ─────────────────────────────────────────────────────────────────────────────

// ── Les 7 acteurs du système KOMOE ──────────────────────────────────────────
// Niveau 1 — Production de la donnée (La Mairie)
//   AGENT_FINANCIER : saisit les transactions (brouillons)
//   MAIRE           : valide et signe les transactions sur la blockchain
// Niveau 2 — Contrôle et régulation (L'État et l'International)
//   DGDDL           : super-admin national, gère les 201 communes
//   COUR_COMPTES    : auditeur financier, accès lecture toutes communes
//   BAILLEUR        : bailleur international, score de transparence
// Niveau 3 — Impact démocratique (La Société Civile)
//   CITOYEN         : lecture publique de sa commune
//   JOURNALISTE     : lecture open data + export multi-communes

export type Role =
  | 'AGENT_FINANCIER'
  | 'MAIRE'
  | 'DGDDL'
  | 'COUR_COMPTES'
  | 'BAILLEUR'
  | 'CITOYEN'
  | 'JOURNALISTE';

// Groupes d'interfaces (plusieurs rôles partagent la même interface de base)
// Interface "COMMUNE"  → AGENT_FINANCIER + MAIRE  (espace mairie)
// Interface "CONTROLE" → DGDDL + COUR_COMPTES     (espace régulation)
// Interface "PUBLIC"   → BAILLEUR + CITOYEN + JOURNALISTE (espace public)
export type InterfaceGroup = 'COMMUNE' | 'CONTROLE' | 'PUBLIC';

// Mapping rôle → groupe d'interface
export const ROLE_TO_GROUP: Record<Role, InterfaceGroup> = {
  AGENT_FINANCIER: 'COMMUNE',
  MAIRE: 'COMMUNE',
  DGDDL: 'CONTROLE',
  COUR_COMPTES: 'CONTROLE',
  BAILLEUR: 'PUBLIC',
  CITOYEN: 'PUBLIC',
  JOURNALISTE: 'PUBLIC',
};

// Libellés affichables
export const ROLE_LABELS: Record<Role, string> = {
  AGENT_FINANCIER: 'Agent Financier',
  MAIRE: 'Maire / Conseil Municipal',
  DGDDL: "DGDDL / Ministère de l'Intérieur",
  COUR_COMPTES: 'Cour des Comptes',
  BAILLEUR: 'Bailleur International',
  CITOYEN: 'Citoyen',
  JOURNALISTE: 'Journaliste / ONG',
};

// ── Commune ──────────────────────────────────────────────────────────────────
export interface Commune {
  id: string;
  nom: string;
  region: string;
  district: string;
  budgetAlloue: number;       // en FCFA
  budgetDepense: number;      // en FCFA
  scoreTransparence: number;  // 0–100
  coordonnees: { lat: number; lng: number };
  walletAddress?: string;     // Adresse Polygon du wallet communal
}

// ── Bailleur international ───────────────────────────────────────────────────
export interface Bailleur {
  id: string;
  nom: string;
  type: string; // 'Multilatéral' | 'Bilatéral' | 'Régional'
  fondsAlloues: number;       // en FCFA
  communesSoutenues: string[]; // IDs de communes
}

// ── Institution de supervision ───────────────────────────────────────────────
// Représente la DGDDL ou la Cour des Comptes dans le contexte contrôle
export interface InstitutionControle {
  id: string;
  nom: string;
  type: string; // 'Ministère' | 'Juridiction'
  auditsRealises: number;
  communesSupervisees: number; // nombre
  alertesActives: number;
}

// ── Transaction budgétaire ───────────────────────────────────────────────────
export type TransactionType = 'DEPENSE' | 'RECETTE';
export type TransactionStatus =
  | 'BROUILLON'            // créé par l'Agent, pas encore signé
  | 'EN_ATTENTE_VALIDATION'// soumis au Maire
  | 'EN_COURS_BLOCKCHAIN'  // signature Polygon en cours
  | 'CONFIRME'             // inscrit sur Polygon, hash disponible
  | 'ECHOUE';              // erreur lors de l'inscription

export interface Transaction {
  id: string;
  type: TransactionType;
  montant: number;           // en FCFA
  categorie: string;         // 'Infrastructure' | 'Santé' | 'Éducation' | 'Eau' | 'Agriculture' | 'Sécurité'
  categorieODD: string;      // 'ODD 9' | 'ODD 3' | 'ODD 4' | 'ODD 6' | etc.
  beneficiaire: string;
  description: string;
  communeId: string;
  bailleurId?: string;
  agentId?: string;          // Rôle : AGENT_FINANCIER qui a saisi
  maireSigantaireId?: string;// Rôle : MAIRE qui a validé
  date: string;              // ISO String — date de saisie
  dateValidation?: string;   // ISO String — date de signature Maire
  // Blockchain Polygon
  txHash?: string;           // Hash Polygon (null si non encore on-chain)
  blockNumber?: number;      // Numéro de bloc Polygon
  ipfsHash?: string;         // Hash IPFS du justificatif PDF (Pinata)
  status: TransactionStatus;
}

// ── Catégorie budgétaire ODD ─────────────────────────────────────────────────
export interface CategorieODD {
  code: string;
  label: string;
  odd: string;
  couleur: string;
}

// ── Réseau Polygon ───────────────────────────────────────────────────────────
export interface PolygonNetwork {
  chainId: number;         // 80002 (Amoy testnet) | 137 (mainnet)
  name: string;            // 'Polygon Amoy' | 'Polygon Mainnet'
  rpcUrl: string;
  explorerUrl: string;     // https://amoy.polygonscan.com
  currency: string;        // 'MATIC'
}
