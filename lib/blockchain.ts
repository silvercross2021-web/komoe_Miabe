/**
 * ABI du contrat BudgetLedger déployé sur Polygon Amoy.
 * Généré depuis contracts/contracts/BudgetLedger.sol (version complète KOMOE MIABE 2026)
 * 
 * IMPORTANT : Mettre à jour NEXT_PUBLIC_CONTRACT_ADDRESS dans .env.local
 * après chaque nouveau déploiement.
 */
export const BUDGET_LEDGER_ABI = [
  // ─── Fonctions d'écriture (Agent) ──────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "depenseId",  "type": "string" },
      { "internalType": "string", "name": "communeId",  "type": "string" },
      { "internalType": "uint256","name": "montant",    "type": "uint256" },
      { "internalType": "string", "name": "categorie",  "type": "string" },
      { "internalType": "string", "name": "ipfsHash",   "type": "string" }
    ],
    "name": "soumettreDepense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "recetteId",  "type": "string" },
      { "internalType": "string", "name": "communeId",  "type": "string" },
      { "internalType": "uint256","name": "montant",    "type": "uint256" },
      { "internalType": "string", "name": "source",     "type": "string" },
      { "internalType": "string", "name": "ipfsHash",   "type": "string" }
    ],
    "name": "soumettreRecette",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ─── Fonctions d'écriture (Maire) ──────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "depenseId",  "type": "string" },
      { "internalType": "string", "name": "communeId",  "type": "string" },
      { "internalType": "uint256","name": "montant",    "type": "uint256" },
      { "internalType": "string", "name": "categorie",  "type": "string" },
      { "internalType": "string", "name": "ipfsHash",   "type": "string" }
    ],
    "name": "validerDepense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "recetteId",  "type": "string" },
      { "internalType": "string", "name": "communeId",  "type": "string" },
      { "internalType": "uint256","name": "montant",    "type": "uint256" },
      { "internalType": "string", "name": "source",     "type": "string" },
      { "internalType": "string", "name": "ipfsHash",   "type": "string" }
    ],
    "name": "enregistrerRecette",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string",  "name": "communeId", "type": "string" },
      { "internalType": "uint256", "name": "montant",   "type": "uint256" }
    ],
    "name": "enregistrerDotation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ─── Gestion des rôles (Admin DGDDL) ──────────────────────────────────────
  // NOTE : attribuerRoleAgent prend (address wallet, string communeId)
  // Le communeId scope l'agent à une seule commune (anti-usurpation)
  {
    "inputs": [
      { "internalType": "address", "name": "wallet",    "type": "address" },
      { "internalType": "string",  "name": "communeId", "type": "string" }
    ],
    "name": "attribuerRoleAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "wallet",    "type": "address" },
      { "internalType": "string",  "name": "communeId", "type": "string" }
    ],
    "name": "attribuerRoleMaire",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role",   "type": "bytes32" },
      { "internalType": "address", "name": "wallet", "type": "address" }
    ],
    "name": "revoquerRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ─── Pause d'urgence (Admin DGDDL) ─────────────────────────────────────────
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ─── Vues (lecture publique) ────────────────────────────────────────────────
  {
    "inputs": [],
    "name": "totalTransactions",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "wallet", "type": "address" }],
    "name": "estAgent",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "wallet", "type": "address" }],
    "name": "estMaire",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "walletCommune",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  // ─── Events (registre immuable public) ─────────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "depenseId",  "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",  "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant",    "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "categorie",  "type": "string" },
      { "indexed": false, "internalType": "string",  "name": "ipfsHash",   "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "soumisePar", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",  "type": "uint256" }
    ],
    "name": "DepenseSoumise",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "depenseId",  "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",  "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant",    "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "categorie",  "type": "string" },
      { "indexed": false, "internalType": "string",  "name": "ipfsHash",   "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "validePar",  "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",  "type": "uint256" }
    ],
    "name": "DepenseValidee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "recetteId",  "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",  "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant",    "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "source",     "type": "string" },
      { "indexed": false, "internalType": "string",  "name": "ipfsHash",   "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "parAgent",   "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",  "type": "uint256" }
    ],
    "name": "RecetteSoumise",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "recetteId",       "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",       "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant",         "type": "uint256" },
      { "indexed": false, "internalType": "string",  "name": "source",          "type": "string" },
      { "indexed": false, "internalType": "string",  "name": "ipfsHash",        "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "enregistreePar",  "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",       "type": "uint256" }
    ],
    "name": "RecetteEnregistree",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "wallet",   "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "parAdmin", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp","type": "uint256" }
    ],
    "name": "AgentRoleAttribue",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "wallet",   "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "parAdmin", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp","type": "uint256" }
    ],
    "name": "MaireRoleAttribue",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "bytes32", "name": "role",     "type": "bytes32" },
      { "indexed": true,  "internalType": "address", "name": "wallet",   "type": "address" },
      { "indexed": true,  "internalType": "address", "name": "parAdmin", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp","type": "uint256" }
    ],
    "name": "RoleRevoque",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "communeId", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "montant",   "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DotationEnregistree",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "propositionId", "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",     "type": "string" },
      { "indexed": false, "internalType": "string",  "name": "ipfsHash",      "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "parMaire",      "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",     "type": "uint256" }
    ],
    "name": "PropositionOfficialisee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "propositionId",   "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",       "type": "string" },
      { "indexed": false, "internalType": "bool",    "name": "approuvee",       "type": "bool" },
      { "indexed": false, "internalType": "uint256", "name": "nbVotesSoutien",  "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "nbVotesOpposition","type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",       "type": "uint256" }
    ],
    "name": "PropositionCloturee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "signalementId", "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",     "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "parDGDDL",      "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",     "type": "uint256" }
    ],
    "name": "EnqueteLancee",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "string",  "name": "signalementId", "type": "string" },
      { "indexed": true,  "internalType": "string",  "name": "communeId",     "type": "string" },
      { "indexed": false, "internalType": "string",  "name": "resolution",    "type": "string" },
      { "indexed": true,  "internalType": "address", "name": "parDGDDL",      "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp",     "type": "uint256" }
    ],
    "name": "EnqueteResolue",
    "type": "event"
  },
  // ─── Fonctions Budget Participatif (Maire) ──────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "propositionId", "type": "string" },
      { "internalType": "string", "name": "communeId",     "type": "string" },
      { "internalType": "string", "name": "ipfsHash",      "type": "string" }
    ],
    "name": "officialiserProposition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string",  "name": "propositionId",    "type": "string" },
      { "internalType": "string",  "name": "communeId",        "type": "string" },
      { "internalType": "bool",    "name": "approuvee",        "type": "bool" },
      { "internalType": "uint256", "name": "nbVotesSoutien",   "type": "uint256" },
      { "internalType": "uint256", "name": "nbVotesOpposition","type": "uint256" }
    ],
    "name": "cloturerProposition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ─── Fonctions Enquêtes (Admin DGDDL) ───────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "signalementId", "type": "string" },
      { "internalType": "string", "name": "communeId",     "type": "string" }
    ],
    "name": "lancerEnquete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "signalementId", "type": "string" },
      { "internalType": "string", "name": "communeId",     "type": "string" },
      { "internalType": "string", "name": "resolution",    "type": "string" }
    ],
    "name": "resoudreEnquete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }

] as const;

/**
 * Adresse du contrat déployé sur Polygon Amoy (Testnet).
 * Mettre à jour .env.local → NEXT_PUBLIC_CONTRACT_ADDRESS après chaque redéploiement.
 */
export const BUDGET_LEDGER_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xDd60F74Dbca514C8eD1AfecFad054F416B18E6D4"
) as `0x${string}`;
