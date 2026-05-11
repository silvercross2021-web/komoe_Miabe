"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-8xl font-black text-primary tracking-tighter animate-bounce">
          404
        </h1>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Page Introuvable
        </h2>
        <p className="text-muted-foreground text-sm font-medium">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <Link href="/login">
            <Button variant="outline" className="flex items-center gap-2 border-border text-foreground hover:bg-muted font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Aller à la connexion
            </Button>
          </Link>
          <Link href="/">
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Home className="w-4 h-4" />
              Retourner à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
