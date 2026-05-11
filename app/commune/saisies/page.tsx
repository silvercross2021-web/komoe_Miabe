"use client";

import { useState, useMemo } from "react";
import DataTable, { ColumnConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/Drawer";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCommuneTransactions, STATUT_LABELS, STATUT_VARIANT } from "@/lib/hooks/useTransactions";
import { type Transaction, transactionsApi } from "@/lib/api";
import { DepenseForm } from "@/components/agent/DepenseForm";
import StatsCard from "@/components/ui/StatsCard";
import { Receipt, Wallet, ArrowDownRight, Pencil, Trash2, FileText, Plus } from "lucide-react";
import { formatFCFA, stripHtml } from "@/lib/constants";
import { useCommuneDetail } from "@/lib/hooks/useCommunes";

type TransactionType = "TOUS" | "DEPENSE" | "RECETTE";
type TransactionStatut = "TOUS" | "BROUILLON" | "SOUMIS" | "VALIDE" | "REJETE";

export default function SaisiesPage() {
  const { user } = useAuth();
  const communeId = user?.commune ?? null;
  const { transactions, loading, refetch } = useCommuneTransactions(communeId);
  const { commune } = useCommuneDetail(communeId);

  const [typeFilter, setTypeFilter] = useState<TransactionType>("TOUS");
  const [statutFilter, setStatutFilter] = useState<TransactionStatut>("TOUS");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"DEPENSE" | "RECETTE">("DEPENSE");

  const isAgentFinancier = user?.role === "AGENT_FINANCIER";
  const isMaire = user?.role === "MAIRE";
  const canCreate = isAgentFinancier;
  const canValidate = isMaire;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const typeMatch = typeFilter === "TOUS" || t.type === typeFilter;
      const statutMatch = statutFilter === "TOUS" || t.statut === statutFilter;
      return typeMatch && statutMatch;
    });
  }, [transactions, typeFilter, statutFilter]);

  const stats = useMemo(() => {
    const depenses = transactions.filter(t => t.type === "DEPENSE");
    const recettes = transactions.filter(t => t.type === "RECETTE");
    const totalDepense = depenses.reduce((acc, t) => acc + (t.statut === "VALIDE" ? t.montant_fcfa : 0), 0);
    const totalRecette = recettes.reduce((acc, t) => acc + (t.statut === "VALIDE" ? t.montant_fcfa : 0), 0);
    const budgetAnnuel = commune?.budget_annuel_fcfa ?? 0;
    const consommation = budgetAnnuel > 0 ? (totalDepense / budgetAnnuel) * 100 : 0;

    return { depenses, recettes, totalDepense, totalRecette, consommation, budgetAnnuel };
  }, [transactions, commune]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    try {
      await transactionsApi.delete(id);
      refetch();
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const openCreateDrawer = (type: "DEPENSE" | "RECETTE") => {
    setDrawerMode(type);
    setIsDrawerOpen(true);
  };

  const columns: ColumnConfig<Transaction>[] = [
    {
      header: "Type",
      key: "type",
      render: (val) => (
        <Badge variant={val === "DEPENSE" ? "destructive" : "default"} className="rounded-full px-3">
          {val === "DEPENSE" ? "↓ Dépense" : "↑ Recette"}
        </Badge>
      )
    },
    {
      header: "Description",
      key: "description",
      render: (val, item) => (
        <div>
          <div className="font-black text-foreground line-clamp-1">{stripHtml(val)}</div>
          <div className="text-[10px] font-bold text-primary mt-1 uppercase tracking-widest bg-primary/5 w-fit px-2 py-0.5 rounded-md border border-primary/10">
            {item.categorie}
          </div>
        </div>
      )
    },
    {
      header: "Montant",
      key: "montant_fcfa",
      render: (val, item) => (
        <span className={`font-black tabular-nums ${item.type === "DEPENSE" ? "text-rose-600" : "text-green-600"}`}>
          {item.type === "DEPENSE" ? "-" : "+"}{formatFCFA(val)}
        </span>
      )
    },
    {
      header: "Date",
      key: "created_at",
      render: (val) => <span className="text-muted-foreground font-medium text-sm">{new Date(val).toLocaleDateString("fr-FR")}</span>
    },
    {
      header: "Statut",
      key: "statut",
      render: (val) => (
        <Badge variant={STATUT_VARIANT[val] as any ?? "outline"}>
          {STATUT_LABELS[val] ?? val}
        </Badge>
      )
    },
    {
      header: "Actions",
      key: "id",
      render: (val, item) => (
        <div className="flex items-center gap-2">
          <Link href={`/commune/transactions/${val}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <FileText className="w-4 h-4" />
            </Button>
          </Link>
          {item.statut === "BROUILLON" && canCreate && (
            <>
              <Link href={`/commune/transactions/${val}/modifier`}>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-amber-600">
                  <Pencil className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-rose-600"
                onClick={() => handleDelete(val)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Saisies Budgétaires</h2>
          <p className="text-muted-foreground mt-2 font-medium text-sm max-w-xl">
            Vue centralisée de toutes les dépenses et recettes. Filtrez par type et statut.
          </p>
        </div>
        {canCreate && (
          <div className="flex gap-3 shrink-0">
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 rounded-2xl h-14 px-6 font-black text-sm transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => openCreateDrawer("DEPENSE")}
            >
              <Plus className="w-5 h-5 mr-2" /> Dépense
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20 rounded-2xl h-14 px-6 font-black text-sm transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => openCreateDrawer("RECETTE")}
            >
              <Plus className="w-5 h-5 mr-2" /> Recette
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard label="Total Dépenses" value={stats.totalDepense} isCurrency icon={<ArrowDownRight className="text-rose-500" />} />
        <StatsCard label="Total Recettes" value={stats.totalRecette} isCurrency icon={<ArrowDownRight className="text-green-500 rotate-180" />} />
        <StatsCard label="Budget Consommé" value={`${stats.consommation.toFixed(1)}%`} icon={<Wallet className="text-amber-500" />} />
        <StatsCard label="Saisies" value={filteredTransactions.length} icon={<Receipt className="text-primary" />} />
      </div>

      {/* Filters */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="TOUS">Tous les types</option>
              <option value="DEPENSE">Dépenses uniquement</option>
              <option value="RECETTE">Recettes uniquement</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Statut</label>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value as TransactionStatut)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="BROUILLON">Brouillon</option>
              <option value="SOUMIS">Soumis</option>
              <option value="VALIDE">Validé</option>
              <option value="REJETE">Rejeté</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        title={`Saisies (${filteredTransactions.length})`}
        columns={columns}
        data={filteredTransactions}
        loading={loading}
      />

      {/* Create Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <DrawerContent className="max-w-2xl mx-auto rounded-t-[32px] border-x border-t border-border bg-card shadow-2xl p-0 overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-2" />
          <DrawerHeader className="px-10 pt-6 pb-2">
            <DrawerTitle className="text-2xl font-black uppercase tracking-tight italic">
              Nouvelle {drawerMode === "DEPENSE" ? "Dépense" : "Recette"}
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground font-medium italic mt-1">
              Saisissez les détails. Un justificatif IPFS sera requis pour la validation blockchain.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-10 py-6">
            <DepenseForm
              initialType={drawerMode}
              onSuccess={() => {
                setIsDrawerOpen(false);
                refetch();
              }}
              onCancel={() => setIsDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
