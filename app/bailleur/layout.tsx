import { AppLayout } from '@/components/layout/AppLayout';

// ⚠️  ANCIEN ESPACE BAILLEUR — maintenant fusionné dans /public/
// Ce layout redirige vers le bon espace public
// Conservé pour compatibilité avec les anciens liens de la sidebar
export default function BailleurLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role="BAILLEUR">{children}</AppLayout>;
}
