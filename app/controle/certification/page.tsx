"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, CheckCircle2, XCircle, Loader2, Search, Eye, FileText, Calendar } from "lucide-react";
import { authApi, type ApiError } from "@/lib/api";

interface CertificationRequest {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  cni_numero: string;
  cni_date_expiration: string;
  certification_status: "PENDING" | "APPROVED" | "REJECTED";
  certification_reviewed_date?: string;
  wallet_address: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "default",
  APPROVED: "secondary",
  REJECTED: "destructive",
};

export default function CertificationPage() {
  const [requests, setRequests] = useState<CertificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<CertificationRequest | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    fetchCertifications();
  }, [statusFilter]);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const data = await authApi.listPendingCertifications();
      setRequests(
        (data.pending_certifications || []).filter(
          (r: any) =>
            statusFilter === "ALL" || r.certification_status === statusFilter
        )
      );
    } catch (err) {
      console.error("Erreur fetch certifications:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;

    setIsReviewing(true);
    try {
      await authApi.reviewCertification(selectedRequest.id, action);
      fetchCertifications();
      setSelectedRequest(null);
      setReviewAction(null);
    } catch (err) {
      console.error("Erreur review:", err);
      const errorMsg = (err as ApiError).message || "Erreur lors de la validation";
      alert(errorMsg);
    } finally {
      setIsReviewing(false);
    }
  };

  const filtered = requests.filter((r) => {
    const fullName = `${r.prenom} ${r.nom}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || r.cni_numero.includes(search)
    );
  });

  const pending = requests.filter((r) => r.certification_status === "PENDING").length;
  const approved = requests.filter((r) => r.certification_status === "APPROVED").length;
  const rejected = requests.filter((r) => r.certification_status === "REJECTED").length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black">Validation Sentinelle</h1>
        </div>
        <p className="text-muted-foreground font-medium">
          Vérifiez et validez les demandes de certification blockchain des citoyens.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-amber-200/50 bg-amber-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground font-medium">En attente</p>
            <p className="text-3xl font-black text-amber-600">{pending}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200/50 bg-emerald-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground font-medium">Approuvés</p>
            <p className="text-3xl font-black text-emerald-600">{approved}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200/50 bg-red-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground font-medium">Rejetés</p>
            <p className="text-3xl font-black text-red-600">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, ou CNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvés</option>
          <option value="REJECTED">Rejetés</option>
          <option value="ALL">Tous</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Aucune demande de certification trouvée.
            </CardContent>
          </Card>
        ) : (
          filtered.map((request) => (
            <Card
              key={request.id}
              className={`border-l-4 ${
                request.certification_status === "PENDING"
                  ? "border-l-amber-500 border-amber-100 bg-amber-50/30"
                  : request.certification_status === "APPROVED"
                    ? "border-l-emerald-500 border-emerald-100 bg-emerald-50/30"
                    : "border-l-red-500 border-red-100 bg-red-50/30"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <h3 className="font-black text-lg">
                          {request.prenom} {request.nom}
                        </h3>
                        <p className="text-xs text-muted-foreground">{request.email}</p>
                      </div>
                      <Badge variant={STATUS_COLORS[request.certification_status]}>
                        {STATUS_LABELS[request.certification_status]}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">CNI:</span>
                        <span className="font-mono font-bold">{request.cni_numero}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Exp:</span>
                        <span className="font-mono font-bold">{request.cni_date_expiration}</span>
                      </div>
                    </div>

                    {request.certification_reviewed_date && (
                      <p className="text-xs text-muted-foreground">
                        Validé le: {new Date(request.certification_reviewed_date).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>

                  {request.certification_status === "PENDING" && (
                    <Button
                      onClick={() => setSelectedRequest(request)}
                      className="ml-4 whitespace-nowrap"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" /> Examiner
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Validation de {selectedRequest.prenom} {selectedRequest.nom}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase">Email</p>
                  <p className="font-mono text-sm">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase">Numéro CNI</p>
                  <p className="font-mono font-bold text-sm">{selectedRequest.cni_numero}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase">Expiration</p>
                  <p className="font-mono text-sm">{selectedRequest.cni_date_expiration}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase">Wallet Blockchain</p>
                  <p className="font-mono text-xs break-all">{selectedRequest.wallet_address || "Pas encore activé"}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium">
                  📄 <strong>Document uploadé:</strong> Demande de certification soumise et en attente de vérification.
                  Tous les documents sont protégés et chiffrés.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-black text-muted-foreground uppercase tracking-wider">Action</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Veuillez vérifier les informations d'identité du citoyen et décider d'approuver ou rejeter sa demande de
                  certification blockchain.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  disabled={isReviewing}
                  className="flex-1"
                >
                  Fermer
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview("reject")}
                  disabled={isReviewing}
                  className="flex-1"
                >
                  {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Rejeter
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={isReviewing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Approuver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
