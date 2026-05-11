"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, PieChart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DataTable from "@/components/ui/DataTable";

export default function BudgetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const historiques = [
    { id: 1, date: "2026-01-10", action: "Allocation Initiale", montant: 50000000, reste: 50000000 },
    { id: 2, date: "2026-03-12", action: "Dépense (Achat de matériel)", montant: -12500000, reste: 37500000 },
    { id: 3, date: "2026-04-05", action: "Révision budgétaire", montant: 5000000, reste: 42500000 },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <Link href="/commune/budget" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-brand-blue mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour au budget global
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight capitalize">Ligne Budgétaire: {id}</h2>
            <Badge variant="success">Actif</Badge>
          </div>
          <p className="text-muted-foreground font-medium text-sm">Vue détaillée des fonds et dépenses sur cette ligne précise.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-sm border-border rounded-3xl bg-brand-blue text-white">
          <CardContent className="p-6">
            <p className="text-sm font-bold text-white/70 uppercase mb-2">Fonds Alloués</p>
            <p className="text-3xl font-black">55 000 000</p>
            <p className="text-sm mt-1">FCFA</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border rounded-3xl bg-brand-orange text-white">
          <CardContent className="p-6">
            <p className="text-sm font-bold text-white/70 uppercase mb-2">Fonds Dépensés</p>
            <p className="text-3xl font-black">12 500 000</p>
            <p className="text-sm mt-1">FCFA</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border rounded-3xl bg-muted">
          <CardContent className="p-6">
            <p className="text-sm font-bold text-muted-foreground uppercase mb-2">Solde Restant</p>
            <p className="text-3xl font-black text-emerald-600">42 500 000</p>
            <p className="text-sm mt-1 text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
      </div>

      <DataTable 
        title="Historique des mouvements"
        data={historiques}
        columns={[
          { header: 'Date', key: 'date', render: (val) => <span className="text-muted-foreground">{val}</span> },
          { header: 'Type d\'opération', key: 'action', render: (val) => <span className="font-bold">{val}</span> },
          { header: 'Montant', key: 'montant', render: (val) => <span className={`font-mono font-bold ${val > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{val > 0 ? '+' : ''}{val.toLocaleString()} FCFA</span> },
          { header: 'Solde après opération', key: 'reste', render: (val) => <span className="font-mono text-foreground">{val.toLocaleString()} FCFA</span> },
        ]}
      />
    </div>
  );
}
