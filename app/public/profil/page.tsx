"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Mail, Phone, Shield, Edit3, Camera, Loader2, MapPin, Star, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/ReusableForm";
import { CheckCircle2, Calendar } from "lucide-react";
import { ipfsService } from "@/lib/ipfs";
import { useRef } from "react";
import { formatDateShort } from "@/lib/constants";

export default function ProfilPublic() {
  const { user, refreshUser } = useAuth();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const initials = `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`;
  const roleLabel = user.profession === "JOURNALISTE" ? "Journaliste" : user.profession === "ONG" ? "ONG / Société civile" : "Citoyen";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = {
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      telephone: formData.get('telephone') as string,
    };

    setIsSubmitting(true);
    try {
      const { authApi } = await import('@/lib/api');
      await authApi.updateMe(data);
      setShowSuccess(true);
      refreshUser();
      setTimeout(() => {
        setShowSuccess(false);
        setIsDrawerOpen(false);
      }, 2000);
    } catch (err: any) {
      alert("Erreur lors de la mise à jour : " + (err.message || "Données invalides"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const hash = await ipfsService.uploadFile(file);
      const url = ipfsService.getPublicUrl(hash);

      const { authApi } = await import('@/lib/api');
      await authApi.updateMe({ avatar: url });

      refreshUser();
      alert("Avatar mis à jour avec succès !");
    } catch (err: any) {
      alert("Erreur lors de l'upload de l'avatar : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight uppercase italic">Mon Profil</h2>
          <p className="text-muted-foreground mt-1 font-medium text-sm italic">Gérez votre profil public et vérifiez votre réputation.</p>
        </div>
        <Button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-12 px-6 flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Edit3 size={18} /> Modifier le profil
        </Button>
      </div>

      {/* MAIN PROFILE CARD */}
      <Card className="shadow-lg border border-border rounded-[32px] overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* AVATAR */}
            <div className="flex flex-col items-center gap-4">
              <div
                onClick={handleAvatarClick}
                className="relative w-32 h-32 rounded-[24px] bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-black text-white cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  initials
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center">Cliquez sur l'avatar pour le changer</p>
            </div>

            {/* PROFILE INFO */}
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-3xl font-black text-foreground tracking-tight uppercase italic">{user.full_name}</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2 italic">{roleLabel}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-[16px] border border-border">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Mail size={12} /> Email
                  </p>
                  <p className="font-bold text-foreground break-all">{user.email}</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-[16px] border border-border">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Phone size={12} /> Téléphone
                  </p>
                  <p className="font-bold text-foreground">{user.telephone || "Non renseigné"}</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-[16px] border border-border">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MapPin size={12} /> Commune
                  </p>
                  <p className="font-bold text-foreground">{user.commune_nom || "Non spécifiée"}</p>
                </div>

                <div className="p-4 bg-primary/10 rounded-[16px] border border-primary/20">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Star size={12} /> Score de Réputation
                  </p>
                  <p className="font-bold text-primary text-lg">{user.reputation_score} points</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Badge variant={user.email_verifie ? "success" : "secondary"} className="justify-center py-2">
                  {user.email_verifie ? <CheckCircle className="w-4 h-4 mr-1" /> : null}
                  Email {user.email_verifie ? "Vérifié" : "Non vérifié"}
                </Badge>

                <Badge variant={user.is_blockchain_authorized ? "success" : "secondary"} className="justify-center py-2">
                  {user.is_blockchain_authorized ? <CheckCircle className="w-4 h-4 mr-1" /> : null}
                  Web3 {user.is_blockchain_authorized ? "Activé" : "Inactif"}
                </Badge>

                <Badge variant={user.journaliste_verifie ? "success" : "secondary"} className="justify-center py-2">
                  {user.journaliste_verifie ? <CheckCircle className="w-4 h-4 mr-1" /> : null}
                  Journaliste {user.journaliste_verifie ? "Vérifié" : "Non vérifié"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VERIFICATION & STATUS SECTION */}
      <Card className="shadow-lg border border-border rounded-[32px]">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-xl font-black uppercase tracking-tight italic">Vérification & Statut</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-[16px] border border-border">
              <span className="text-sm font-bold text-foreground">Compte Actif</span>
              <Badge variant={user.is_active ? "success" : "secondary"} className="font-bold">
                {user.is_active ? "OUI" : "NON"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-[16px] border border-border">
              <span className="text-sm font-bold text-foreground">Inscrit depuis</span>
              <span className="text-sm font-bold text-foreground">{formatDateShort(user.date_joined)}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-[16px] border border-border">
              <span className="text-sm font-bold text-foreground">Identité KYC</span>
              <Badge variant={user.certification_status === "APPROVED" ? "success" : user.certification_status === "REJECTED" ? "destructive" : "secondary"} className="font-bold">
                {user.certification_status === "APPROVED" ? "VÉRIFIÉE" : user.certification_status === "REJECTED" ? "REJETÉE" : "EN ATTENTE"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EDIT DRAWER */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Modifier mon profil</DrawerTitle>
            <DrawerDescription>Mettez à jour vos informations personnelles</DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-6 max-w-md mx-auto w-full">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest">Prénom</label>
              <Input
                name="prenom"
                defaultValue={user.prenom}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest">Nom</label>
              <Input
                name="nom"
                defaultValue={user.nom}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest">Téléphone</label>
              <Input
                name="telephone"
                defaultValue={user.telephone || ""}
                type="tel"
              />
            </div>

            <DrawerFooter className="gap-2">
              {showSuccess && (
                <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-bold animate-pulse">
                  <CheckCircle2 size={18} /> Profil mis à jour !
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" className="w-full">Annuler</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
