import { redirect } from "next/navigation";

// Le détail d'une commune pour un bailleur → page publique
export default function BailleurCommuneDetail({ params }: { params: { id: string } }) {
  redirect(`/public/communes`);
}
