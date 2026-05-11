import { redirect } from "next/navigation";

// Les transactions pour un bailleur → page publique
export default function BailleurTransactionDetail({ params }: { params: { id: string } }) {
  redirect(`/public/transactions`);
}
