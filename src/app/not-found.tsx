import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <p className="text-7xl font-black text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-earth-900">Cette page n&apos;existe pas</h1>
      <p className="mt-2 max-w-md text-sm text-earth-600">
        Le produit a peut-être été retiré, ou l&apos;adresse est erronée. Essayez la recherche ou revenez à
        l&apos;accueil.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary btn-md">Retour à l&apos;accueil</Link>
        <Link href="/produits" className="btn-secondary btn-md">Voir la boutique</Link>
      </div>
      <div className="mt-10 w-full max-w-md">
        <form action="/produits" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Rechercher un produit…"
            aria-label="Rechercher un produit"
            className="field flex-1"
          />
          <button type="submit" className="btn-primary btn-md">Rechercher</button>
        </form>
      </div>
    </div>
  );
}
