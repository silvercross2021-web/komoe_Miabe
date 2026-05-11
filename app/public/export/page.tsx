"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import StatsCard from "@/components/ui/StatsCard";
import { Download, FileText, Table, Globe, Database, Terminal, Zap, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCommunesList } from "@/lib/hooks/useCommunes";
import { useTransactionsList } from "@/lib/hooks/useTransactions";
import { formatFCFA } from "@/lib/constants";

export default function PublicExportPage() {
  const { communes } = useCommunesList();
  const { transactions: txs } = useTransactionsList();
  const confirmes = txs.filter((t) => t.blockchain_tx_hash_validation);

  const exportCSV = (data: object[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const rows = [keys.join(","), ...data.map((r: any) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const EXPORTS = [
    {
      titre: "Annuaire des Collectivités",
      desc: `${communes.length} communes · budgets · scores · géographie`,
      icone: Globe,
      color: "text-blue-500",
      action: () => exportCSV(
        communes.map((c) => ({
          id: c.id, nom: c.nom, region: c.region,
          budget_alloue: c.budget_annuel_fcfa, budget_depense: c.budget_depense_fcfa,
          score_transparence: c.score_transparence,
        })),
        "komoe_open_communes.csv"
      ),
    },
    {
      titre: "Registre Blockchain (Scellé)",
      desc: `${confirmes.length} transactions vérifiées on-chain · Polygon Amoy`,
      icone: Zap,
      color: "text-amber-500",
      action: () => exportCSV(
        confirmes.map((t) => ({
          id: t.id, commune_id: t.commune, type: t.type, montant: t.montant_fcfa,
          categorie: t.categorie, date: t.created_at, statut: t.statut,
          tx_hash: t.blockchain_tx_hash_validation, ipfs_hash: t.ipfs_hash ?? "",
        })),
        "komoe_open_transactions_blockchain.csv"
      ),
    },
    {
      titre: "Flux d'Activité National",
      desc: `${txs.length} transactions validées par les mairies`,
      icone: FileText,
      color: "text-primary",
      action: () => exportCSV(
        txs.map((t) => ({
          id: t.id, commune_id: t.commune, type: t.type, montant: t.montant_fcfa,
          categorie: t.categorie, description: t.description, statut: t.statut, date: t.created_at,
        })),
        "komoe_open_full_activity.csv"
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-[32px] shadow-2xl shadow-primary/5">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic flex items-center gap-3">
             <Database className="text-primary" /> Open Data Portal
          </h2>
          <p className="text-muted-foreground mt-2 font-medium max-w-2xl">
             Accédez librement aux données financières nationales. Toutes les informations publiées sont certifiées par notre infrastructure blockchain.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20">
           <Share2 size={14} className="fill-primary" />
           <span className="text-[10px] font-black uppercase tracking-widest">Licence Ouverte</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Communes Libres" value={communes.length} icon={<Globe className="text-primary" />} />
        <StatsCard label="Transactions On-Chain" value={confirmes.length} icon={<Zap className="text-amber-500" />} />
        <StatsCard label="Flux Audités" value={txs.length} icon={<FileText className="text-blue-500" />} />
        <StatsCard label="Format" value="CSV / JSON" icon={<Table className="text-emerald-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3 shadow-2xl border-border rounded-[32px] overflow-hidden border">
          <CardHeader className="p-8 border-b border-border bg-muted/30">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground">Datasets Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {EXPORTS.map(({ titre, desc, icone: Icon, action, color }) => (
              <div key={titre} className="group flex items-center justify-between p-6 rounded-[24px] bg-white border border-border hover:shadow-xl transition-all hover:border-primary/30">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 bg-muted/50 ${color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-base text-foreground group-hover:text-primary transition-colors">{titre}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{desc}</p>
                  </div>
                </div>
                <Button onClick={action} className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20">
                   <Download size={16} className="mr-2" /> CSV
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-2xl border-border rounded-[32px] overflow-hidden border bg-slate-900 text-white">
            <CardHeader className="p-8 border-b border-white/10 bg-white/5">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                <Terminal className="w-5 h-5 text-primary" />
                API REST For Developers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatisez vos analyses en utilisant nos points de terminaison API. Authentification non requise pour les données publiques.
              </p>
              
              <div className="space-y-4 font-mono text-[10px]">
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 group">
                   <p className="text-primary font-black mb-1">GET /api/communes/</p>
                   <p className="text-slate-500 italic">// Liste complète des communes</p>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 group">
                   <p className="text-primary font-black mb-1">GET /api/transactions/</p>
                   <p className="text-slate-500 italic">// Filtres: ?statut=CONFIRME</p>
                </div>
              </div>

              <div className="pt-4">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 py-2 rounded-lg w-full justify-center">
                   Statut API: OPÉRATIONNEL
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-border shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                 <Share2 size={24} />
              </div>
              <h4 className="text-sm font-black uppercase text-foreground mb-2">Partagez la vérité</h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                Les données KOMOE sont publiées sous licence <span className="text-primary font-bold">Creative Commons 4.0</span>. 
                Utilisez-les pour vos articles de presse, thèses ou applications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
