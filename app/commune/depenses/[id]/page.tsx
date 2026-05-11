"use client";

import { useParams, useRouter } from "next/navigation";
import { useTransactionDetail } from "@/lib/hooks/useTransactions";
import Link from "next/link";

export default function DepenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { transaction, loading, error } = useTransactionDetail(id);

  const formatXOF = (amount: number) =>
    new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF" }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Dépense introuvable.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-brand-blue underline"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
          ← Retour
        </button>
        <h2 className="text-2xl font-extrabold text-foreground">Détail de la dépense</h2>
      </div>

      {/* Card détail */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-muted-foreground mb-1">{transaction.id}</p>
              <h3 className="text-lg font-bold text-foreground">{transaction.description}</h3>
              <p className="text-sm text-muted-foreground mt-1">{transaction.categorie}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                transaction.statut === "VALIDE"
                  ? "bg-green-100 text-green-700"
                  : transaction.statut === "SOUMIS"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {transaction.statut}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Montant</p>
            <p className="text-2xl font-extrabold text-rose-600">
              -{formatXOF(transaction.montant_fcfa)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Période</p>
            <p className="text-sm font-semibold text-foreground">{transaction.periode}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Type</p>
            <p className="text-sm font-semibold text-foreground">{transaction.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Commune</p>
            <p className="text-sm font-semibold text-foreground">
              {transaction.commune_detail?.nom ?? `Commune #${transaction.commune}`}
            </p>
          </div>
        </div>

        {/* Blockchain info */}
        {transaction.blockchain_tx_hash_validation && (
          <div className="p-6 border-t border-border bg-muted">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
              Preuve blockchain (Polygon Amoy)
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_POLYGONSCAN_URL}/tx/${transaction.blockchain_tx_hash_validation}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-brand-blue break-all hover:underline"
            >
              {transaction.blockchain_tx_hash_validation}
            </a>
          </div>
        )}

        {/* IPFS info */}
        {transaction.ipfs_hash && (
          <div className="p-6 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
              Justificatif IPFS
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs"}/${transaction.ipfs_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-brand-blue break-all hover:underline"
            >
              {transaction.ipfs_hash}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
