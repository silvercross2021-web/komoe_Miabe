"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjetDetailPage() {
  const params = useParams();
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <Link href="/bailleur/projets" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-brand-blue mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux projets
      </Link>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Détail du Projet: {params.id}</h2>
        <Badge variant="success" className="mt-2">En cours d'exécution</Badge>
      </div>
      <Card>
        <CardContent className="p-8">
          <p className="text-muted-foreground">Le projet est actuellement financé et suivi sur la blockchain. L'historique des décaissements associés sera affiché ici.</p>
        </CardContent>
      </Card>
    </div>
  );
}
