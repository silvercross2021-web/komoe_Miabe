"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Info,
  FileText,
  Link2,
  Hash,
} from "lucide-react";
import { createPublicClient, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { type Transaction } from "@/lib/api";

type SearchMode = "tx" | "ipfs" | "id";

interface VerifyResult {
  type: "transaction" | "ipfs" | "id" | "blockchain_only";
  transaction?: Transaction;
  blockchainInfo?: {
    blockNumber: number;
    status: string;
    from: string;
    to: string;
  };
  ipfsHash?: string;
}

export default function VerifierPreuvePage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("tx");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { transactions } = useTransactionsList();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("Veuillez entrer un code à vérifier");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // MODE 1: CHERCHER PAR HASH TRANSACTION
      if (searchMode === "tx") {
        if (!searchQuery.startsWith("0x") || searchQuery.length !== 66) {
          setError("Format invalide. Un hash doit être 0x + 64 caractères");
          return;
        }

        // D'abord chercher en base de données
        const found = transactions.find(
          (t) =>
            t.blockchain_tx_hash_validation?.toLowerCase() === searchQuery.toLowerCase() ||
            t.blockchain_tx_hash_soumission?.toLowerCase() === searchQuery.toLowerCase()
        );

        if (found) {
          setResult({
            type: "transaction",
            transaction: found,
          });
          return;
        }

        // Sinon vérifier sur le blockchain
        const client = createPublicClient({
          chain: polygonAmoy,
          transport: http("https://rpc-amoy.polygon.technology"),
        });

        const receipt = await client.getTransactionReceipt({
          hash: searchQuery as `0x${string}`,
        });

        if (!receipt) {
          setError("Cette transaction n'existe pas sur le blockchain");
          return;
        }

        const tx = await client.getTransaction({
          hash: searchQuery as `0x${string}`,
        });

        setResult({
          type: "blockchain_only",
          blockchainInfo: {
            blockNumber: Number(receipt.blockNumber),
            status: receipt.status === "success" ? "CONFIRMÉE" : "ÉCHOUÉE",
            from: tx.from || "N/A",
            to: receipt.to || "N/A",
          },
        });
      }

      // MODE 2: CHERCHER PAR HASH IPFS
      if (searchMode === "ipfs") {
        if (!searchQuery.startsWith("Qm") && !searchQuery.startsWith("0x")) {
          setError("Hash IPFS invalide (doit commencer par Qm)");
          return;
        }

        const found = transactions.find(
          (t) => t.ipfs_hash?.toLowerCase() === searchQuery.toLowerCase()
        );

        if (!found) {
          setError("Cet hash IPFS n'existe pas dans KOMOE");
          return;
        }

        setResult({
          type: "ipfs",
          transaction: found,
          ipfsHash: found.ipfs_hash,
        });
      }

      // MODE 3: CHERCHER PAR ID TRANSACTION
      if (searchMode === "id") {
        const found = transactions.find(
          (t) => String(t.id).toLowerCase() === searchQuery.toLowerCase()
        );

        if (!found) {
          setError("ID de transaction introuvable");
          return;
        }

        setResult({
          type: "id",
          transaction: found,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  const formatFCFA = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "VALIDE":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "SOUMIS":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "BROUILLON":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "REJETE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const shortHash = (hash: string) =>
    hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : "N/A";

  const ipfsUrl = (hash: string) =>
    `https://ipfs.io/ipfs/${hash}`;
  const polygonscanUrl = (hash: string) =>
    `https://amoy.polygonscan.com/tx/${hash}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-white">
            Vérifier une Preuve KOMOE
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Confirmez l'authenticité d'une transaction en cherchant par hash blockchain, IPFS ou ID
          </p>
        </div>

        {/* INFO BOX */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6 flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300/90 space-y-1">
              <p className="font-bold">3 façons de vérifier une transaction :</p>
              <p className="opacity-90">
                • Hash Polygon (0x...) = Prouver la transaction sur le blockchain<br/>
                • Hash IPFS (Qm...) = Vérifier le document justificatif<br/>
                • ID KOMOE = Retrouver une transaction dans la base de données
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SEARCH SECTION */}
        <Card className="border-border bg-slate-800/50 shadow-2xl rounded-[32px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Sélectionnez le type de recherche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* MODE TABS */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "tx" as SearchMode, icon: Hash, label: "Hash Blockchain", desc: "Vérifier sur Polygon" },
                { id: "ipfs" as SearchMode, icon: Link2, label: "Hash IPFS", desc: "Justificatif" },
                { id: "id" as SearchMode, icon: FileText, label: "ID KOMOE", desc: "Retrouver TX" },
              ].map(({ id, icon: Icon, label, desc }) => (
                <button
                  key={id}
                  onClick={() => {
                    setSearchMode(id);
                    setSearchQuery("");
                    setResult(null);
                    setError(null);
                  }}
                  className={`flex-1 min-w-[120px] p-3 rounded-xl transition-all border-2 ${
                    searchMode === id
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-primary/50"
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs opacity-75">{desc}</p>
                </button>
              ))}
            </div>

            {/* SEARCH INPUT */}
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={
                    searchMode === "tx"
                      ? "0x..."
                      : searchMode === "ipfs"
                      ? "QmXx..."
                      : "UUID ou ID"
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(e as any)}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl border border-slate-600 focus:border-primary outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    "Vérifier"
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                {searchMode === "tx" && "Format: 0x + 64 caractères hexadécimaux"}
                {searchMode === "ipfs" && "Format: Hash IPFS commençant par Qm"}
                {searchMode === "id" && "Format: UUID ou ID court de la transaction"}
              </p>
            </form>
          </CardContent>
        </Card>

        {/* ERRORS */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/10">
            <CardContent className="pt-6 flex gap-3 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {/* RESULTS */}
        {result && (
          <div className="space-y-4">
            {/* SUCCESS BANNER */}
            <Card className="border-emerald-500/30 bg-emerald-500/10">
              <CardContent className="pt-6 flex gap-3 text-emerald-300">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-bold">Preuve trouvée et vérifiée !</p>
                  <p className="text-sm opacity-90">
                    {result.type === "transaction" && "Détails de la transaction en base de données"}
                    {result.type === "blockchain_only" && "Transaction confirmée sur le blockchain"}
                    {result.type === "ipfs" && "Justificatif trouvé sur IPFS"}
                    {result.type === "id" && "Transaction retrouvée dans KOMOE"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* TRANSACTION DETAILS */}
            {result.transaction && (
              <Card className="border-border bg-slate-800/50 rounded-[32px]">
                <CardHeader>
                  <CardTitle className="text-white">Détails de la transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-1">Type</p>
                      <p className="text-lg font-bold text-white">
                        {result.transaction.type === "RECETTE" ? "📤 Recette" : "📥 Dépense"}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-1">Montant</p>
                      <p className="text-lg font-bold text-white">
                        {result.transaction.montant_fcfa
                          ? formatFCFA(result.transaction.montant_fcfa)
                          : "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-1">Statut</p>
                      <Badge className={getStatusColor(result.transaction.statut)}>
                        {result.transaction.statut}
                      </Badge>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-1">Catégorie</p>
                      <p className="text-sm font-bold text-white">
                        {result.transaction.categorie || "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-1">Commune</p>
                      <p className="text-sm font-bold text-white">
                        {result.transaction.commune_detail?.nom || "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-1">Créée le</p>
                      <p className="text-xs text-white">
                        {formatDate(result.transaction.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {result.transaction.description && (
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-2">Description</p>
                      <p className="text-sm text-white break-words">
                        {result.transaction.description.replace(/<[^>]*>/g, "")}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Hashes */}
                  {(result.transaction.blockchain_tx_hash_soumission ||
                    result.transaction.blockchain_tx_hash_validation) && (
                    <div className="space-y-3">
                      {result.transaction.blockchain_tx_hash_soumission && (
                        <div className="bg-slate-900/50 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-slate-400 uppercase">Hash Soumission</p>
                            <a
                              href={polygonscanUrl(
                                result.transaction.blockchain_tx_hash_soumission
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-xs font-bold"
                            >
                              Voir →
                            </a>
                          </div>
                          <p className="font-mono text-xs text-slate-300 break-all">
                            {result.transaction.blockchain_tx_hash_soumission}
                          </p>
                        </div>
                      )}

                      {result.transaction.blockchain_tx_hash_validation && (
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-emerald-500/20">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-emerald-400 uppercase font-bold">
                              Hash Validation (Preuve Finale)
                            </p>
                            <a
                              href={polygonscanUrl(
                                result.transaction.blockchain_tx_hash_validation
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-xs font-bold"
                            >
                              Voir sur PolygonScan →
                            </a>
                          </div>
                          <p className="font-mono text-xs text-emerald-300 break-all">
                            {result.transaction.blockchain_tx_hash_validation}
                          </p>
                          <p className="text-xs text-emerald-300/70 mt-2">
                            Cette transaction est IMMUABLE sur le blockchain
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IPFS */}
                  {result.transaction.ipfs_hash && (
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-slate-400 uppercase">Hash IPFS (Document)</p>
                        <a
                          href={ipfsUrl(result.transaction.ipfs_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 text-xs font-bold"
                        >
                          Ouvrir →
                        </a>
                      </div>
                      <p className="font-mono text-xs text-slate-300 break-all">
                        {result.transaction.ipfs_hash}
                      </p>
                    </div>
                  )}

                  {/* Signataires */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.transaction.soumis_par_detail && (
                      <div className="bg-slate-900/50 p-4 rounded-xl">
                        <p className="text-xs text-slate-400 uppercase mb-2">Soumis par</p>
                        <p className="font-bold text-white">
                          {result.transaction.soumis_par_detail.full_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {result.transaction.soumis_par_detail.email}
                        </p>
                      </div>
                    )}

                    {result.transaction.valide_par_detail && (
                      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 uppercase mb-2 font-bold">
                          Validé par
                        </p>
                        <p className="font-bold text-white">
                          {result.transaction.valide_par_detail.full_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {result.transaction.valide_par_detail.email}
                        </p>
                        <p className="text-xs text-emerald-300/70 mt-2">
                          Validée le {formatDate(result.transaction.validated_at || "")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BLOCKCHAIN ONLY */}
            {result.blockchainInfo && !result.transaction && (
              <Card className="border-border bg-slate-800/50 rounded-[32px]">
                <CardHeader>
                  <CardTitle className="text-white">Données Blockchain</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-400 uppercase mb-1">Bloc</p>
                      <p className="text-2xl font-bold text-white">
                        #{result.blockchainInfo.blockNumber.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                      <p className="text-xs text-emerald-400 uppercase mb-1 font-bold">
                        Statut
                      </p>
                      <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-500/30">
                        {result.blockchainInfo.status}
                      </Badge>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl col-span-2 md:col-span-1">
                      <p className="text-xs text-slate-400 uppercase mb-1">Type</p>
                      <p className="text-sm text-white">Extraction directe</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 uppercase mb-2">De</p>
                    <p className="font-mono text-xs text-slate-300 break-all">
                      {result.blockchainInfo.from}
                    </p>
                  </div>

                  <div className="bg-slate-900/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 uppercase mb-2">Vers</p>
                    <p className="font-mono text-xs text-slate-300 break-all">
                      {result.blockchainInfo.to}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* INFO BOX */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-2">
              <p className="font-bold text-white">Qu'est-ce que cela signifie ?</p>
              <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                <li>✅ Votre transaction existe et est immuable</li>
                <li>🔐 Personne ne peut la modifier ou la supprimer</li>
                <li>📜 Elle est écrite définitivement sur Polygon Amoy</li>
                <li>🌐 Elle est publique et vérifiable par tous</li>
              </ul>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!result && !loading && !error && (
          <Card className="border-border bg-slate-800/50">
            <CardContent className="pt-10 pb-10 text-center text-slate-400 space-y-3">
              <p className="text-lg">Prêt à vérifier une preuve ?</p>
              <p className="text-sm">
                Entrez un hash blockchain, IPFS ou ID pour commencer la vérification
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
