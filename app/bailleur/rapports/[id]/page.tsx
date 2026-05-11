"use client";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DocumentPreview } from "@/components/ui/DocumentPreview";

export default function RapportDetailPage() {
  const params = useParams();
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <Link href="/bailleur/rapports" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-brand-blue mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux rapports
      </Link>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Rapport d'Audit: {params.id}</h2>
        <Badge variant="success" className="mt-2">Conforme</Badge>
      </div>
      <Card>
        <CardContent className="p-8 space-y-6">
          <p className="text-muted-foreground">Consultez le document détaillé généré par les auditeurs on-chain ci-dessous.</p>
          <DocumentPreview fileName={`Rapport_${params.id}.pdf`} fileSize="3.1 MB" type="pdf" onDownload={() => {}} />
        </CardContent>
      </Card>
    </div>
  );
}
