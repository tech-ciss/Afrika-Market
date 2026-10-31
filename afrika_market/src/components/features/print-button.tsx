"use client";

import { Printer } from "lucide-react";

/** Impression de la facture / du bon de commande (§17). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-secondary btn-md print:hidden"
      aria-label="Imprimer la facture"
    >
      <Printer className="h-4 w-4" /> Imprimer la facture
    </button>
  );
}
