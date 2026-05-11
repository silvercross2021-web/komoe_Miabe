"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardView } from "@/views/DashboardView";
import { Role } from "@/types";

export default function PublicDashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
      </div>
    );
  }

  // Rôles publics : CITOYEN, JOURNALISTE, BAILLEUR
  const role = (user?.role ?? "CITOYEN") as Role;
  return <DashboardView role={role} />;
}
