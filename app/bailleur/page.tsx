import { redirect } from "next/navigation";

// Le groupe BAILLEUR utilise l'interface /public/*
// Ce dossier /bailleur/ est un alias redirigé vers /public/
export default function BailleurRoot() {
  redirect("/public/dashboard");
}
