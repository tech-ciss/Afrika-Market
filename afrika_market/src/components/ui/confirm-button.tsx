"use client";

import * as React from "react";

/**
 * Bouton de formulaire qui demande confirmation avant d'envoyer (annulation, remboursement, suspension…).
 * Sans JavaScript le formulaire part tel quel : la confirmation est un garde-fou d'interface,
 * la vraie règle (statuts autorisés, droits) reste vérifiée côté serveur.
 */
export function ConfirmButton({
  message,
  className,
  children,
  disabled,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
