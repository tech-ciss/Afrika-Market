import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
      {/* « 404 » dans une arche : la page n'existe pas, le décor reste celui du site. */}
      <span className="arch flex h-40 w-32 items-end justify-center bg-brand-900 pb-7 font-display text-5xl font-extrabold text-sun-400" aria-hidden>
        404
      </span>
      <h1 className="mt-8 font-display text-3xl font-extrabold sm:text-4xl">Cette page n&apos;existe pas</h1>
      <p className="mt-3 max-w-md text-earth-600">
        Le produit a peut-être été retiré, ou l&apos;adresse est erronée. Essayez la recherche ou revenez à
        l&apos;accueil.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary btn-md">
          Retour à l&apos;accueil
        </Link>
        <Link href="/produits" className="btn-secondary btn-md">
          Voir la boutique
        </Link>
      </div>
      <div className="mt-10 w-full max-w-md">
        <form action="/produits" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Rechercher : karité, cacao, miel…"
            aria-label="Rechercher un produit"
            className="field flex-1 rounded-full px-5"
          />
          <button type="submit" className="btn-primary btn-md">
            Rechercher
          </button>
        </form>
      </div>
    </div>
  );
}
