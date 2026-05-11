"use client";

import { useAuth } from "@/lib/auth-context";
import { DashboardView } from "@/views/DashboardView";
import { Role } from "@/types";

export default function CommuneDashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange" />
      </div>
    );
  }

  // Rôles commune : AGENT_FINANCIER ou MAIRE
  const role = (user?.role ?? "AGENT_FINANCIER") as Role;
  return <DashboardView role={role} />;
}
