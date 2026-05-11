import { createPublicClient, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { BUDGET_LEDGER_ADDRESS } from "@/lib/blockchain";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const RPC_ENDPOINTS = [
  "https://polygon-amoy-bor-rpc.publicnode.com",
  "https://polygon-amoy.drpc.org",
  "https://rpc-amoy.polygon.technology",
];

const ROLE_LABELS: Record<string, string> = {
  AGENT_FINANCIER: "Agent Financier",
  MAIRE: "Maire",
  DGDDL: "DGDDL",
  COUR_COMPTES: "Cour des Comptes",
  BAILLEUR: "Bailleur",
  JOURNALISTE: "Journaliste",
  CITOYEN: "Citoyen",
};

// Group codes: 1=Contract, 3=Maire, 4=DGDDL, 5=Agent, 6=Commune, 7=Other
function roleToGroup(role: string): number {
  if (role === "AGENT_FINANCIER") return 5;
  if (role === "MAIRE") return 3;
  if (role === "DGDDL" || role === "COUR_COMPTES") return 4;
  return 7;
}

async function getCurrentBlockNumber(): Promise<string> {
  for (const rpc of RPC_ENDPOINTS) {
    try {
      const client = createPublicClient({
        chain: polygonAmoy,
        transport: http(rpc, { timeout: 8_000 }),
      });
      const bn = await client.getBlockNumber();
      return bn.toString();
    } catch {}
  }
  return "N/A";
}

export async function GET() {
  try {
    if (!BUDGET_LEDGER_ADDRESS) {
      return Response.json({ success: false, error: "Contract not configured" }, { status: 400 });
    }

    // Fetch all validated transactions from KOMOE backend
    const res = await fetch(`${BACKEND_URL}/api/transactions/?statut=VALIDE&limit=200`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`Backend error: ${res.status}`);

    const data = await res.json();
    const transactions: any[] = Array.isArray(data) ? data : data?.results ?? [];

    // ── Extract unique actors and communes ─────────────────────────────────────

    // Map: walletAddress → actor info
    const actors = new Map<string, {
      name: string;
      role: string;
      commune: string;
      communeId: number;
      submitted: number;
      validated: number;
      recettes: number;
      depenses: number;
    }>();

    // Map: communeId → commune name
    const communes = new Map<number, string>();

    transactions.forEach((tx: any) => {
      const communeId: number = tx.commune;
      const communeName: string = tx.commune_detail?.nom ?? `Commune #${communeId}`;
      communes.set(communeId, communeName);

      const isRecette = tx.type === "RECETTE";

      const addOrUpdate = (profile: any, field: "submitted" | "validated") => {
        if (!profile?.wallet_address) return;
        const wallet = profile.wallet_address.toLowerCase();
        const existing = actors.get(wallet);
        actors.set(wallet, {
          name: profile.full_name || profile.email || "Inconnu",
          role: profile.role || "CITOYEN",
          commune: communeName,
          communeId,
          submitted: (existing?.submitted ?? 0) + (field === "submitted" ? 1 : 0),
          validated: (existing?.validated ?? 0) + (field === "validated" ? 1 : 0),
          recettes: (existing?.recettes ?? 0) + (field === "submitted" && isRecette ? 1 : field === "validated" && isRecette ? 1 : 0),
          depenses: (existing?.depenses ?? 0) + (field === "submitted" && !isRecette ? 1 : field === "validated" && !isRecette ? 1 : 0),
        });
      };

      addOrUpdate(tx.soumis_par_detail, "submitted");
      addOrUpdate(tx.valide_par_detail, "validated");
    });

    // ── Build nodes ────────────────────────────────────────────────────────────

    const nodes: any[] = [];
    const links: any[] = [];

    // Node 1: Smart Contract (center)
    nodes.push({
      id: "contract",
      group: 1,
      val: 30,
      label: "Smart Contract",
      sublabel: "BudgetLedger",
      address: BUDGET_LEDGER_ADDRESS,
      description: `${transactions.length} transaction${transactions.length > 1 ? "s" : ""} enregistrée${transactions.length > 1 ? "s" : ""}`,
    });

    // Nodes per commune (intermediate grouping)
    const uniqueCommunes = Array.from(communes.entries());
    uniqueCommunes.forEach(([communeId, communeName]) => {
      const communeNodeId = `commune-${communeId}`;
      const txCount = transactions.filter(t => t.commune === communeId).length;
      nodes.push({
        id: communeNodeId,
        group: 6,
        val: 18,
        label: communeName,
        sublabel: `Commune • ${txCount} tx`,
        description: `Commune de ${communeName}`,
      });
      // Link commune → contract
      links.push({ source: communeNodeId, target: "contract", type: "institutional" });
    });

    // Nodes per actor (Agent, Maire, etc.)
    Array.from(actors.entries()).forEach(([wallet, info]) => {
      const actorId = `actor-${wallet}`;
      const roleLabel = ROLE_LABELS[info.role] ?? info.role;
      const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
      const totalTx = info.submitted + info.validated;

      nodes.push({
        id: actorId,
        group: roleToGroup(info.role),
        val: Math.min(22, 8 + Math.log(Math.max(1, totalTx)) * 3),
        label: info.name,
        sublabel: `${roleLabel} • ${info.commune}`,
        address: wallet,
        role: info.role,
        commune: info.commune,
        communeId: info.communeId,
        submitted: info.submitted,
        validated: info.validated,
        recettes: info.recettes,
        depenses: info.depenses,
        description: `${roleLabel} de ${info.commune}\n${shortWallet}\n${info.submitted} soumission${info.submitted > 1 ? "s" : ""} • ${info.validated} validation${info.validated > 1 ? "s" : ""}`,
      });

      // Link actor → commune
      const communeNodeId = `commune-${info.communeId}`;
      links.push({ source: actorId, target: communeNodeId, type: "member" });

      // Link actor → contract (direct blockchain interaction)
      links.push({ source: actorId, target: "contract", type: "blockchain" });
    });

    // No transactions yet fallback
    if (actors.size === 0) {
      nodes.push({
        id: "waiting",
        group: 2,
        val: 12,
        label: "En attente",
        sublabel: "Aucune transaction validée",
      });
    }

    // Get current block number from blockchain (non-blocking)
    const blockNumber = await getCurrentBlockNumber();

    return Response.json({
      success: true,
      data: { nodes, links },
      stats: {
        totalValidators: actors.size,
        totalTransactions: transactions.length,
        totalCommunes: communes.size,
        blockNumber,
        source: "KOMOE Database + Polygon Amoy",
      },
    });

  } catch (error: any) {
    console.error("Topology error:", error?.message);
    return Response.json(
      {
        success: false,
        error: "Impossible de charger la topologie.",
        data: {
          nodes: [
            { id: "contract", group: 1, val: 30, label: "Smart Contract", sublabel: "BudgetLedger", address: BUDGET_LEDGER_ADDRESS },
            { id: "error", group: 2, val: 10, label: "Erreur réseau", sublabel: "Réessayez" },
          ],
          links: [],
        },
      },
      { status: 200 }
    );
  }
}
