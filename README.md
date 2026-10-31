# 🌍 AFRIKA MARKET

Plateforme e-commerce ouest-africaine de produits locaux, artisanaux et culturels.
Lancement en **Côte d'Ivoire**, architecture multi-pays (UEMOA), devise **XOF (FCFA)**.

> **La marketplace qui rapproche l'Afrique de ses consommateurs.**

🔗 **Démo en ligne : https://afrika-market-tis9.vercel.app**

---

## 📦 Fonctionnalités

- Catalogue complet : recherche, filtres, tri, catégories et sous-catégories
- **Origine et traçabilité** : pays, région, ville, producteur, méthode de production, période de récolte
- Fiches producteurs avec validation administrative (`PENDING` / `APPROVED` / `SUSPENDED` / `REJECTED`)
- Panier persistant (base de données pour les comptes, `localStorage` pour les visiteurs), fusion à la connexion
- Checkout en 6 étapes, commande invité ou connecté
- **Abstraction de paiement multi-provider** (Wave, Orange Money, MTN, Moov, carte, paiement à la livraison) avec webhook signé et idempotent
- Commandes avec snapshot, matrice de transitions et suivi de livraison
- Stock décrémenté **de façon transactionnelle et conditionnelle** (pas de sur-commande), restitué à toute annulation ou échec de paiement, et libéré automatiquement si la commande n'est pas payée à temps
- Promotions : pourcentage, montant fixe, livraison offerte, portée produit ou catégorie
- Espace client : profil, adresses, commandes, wishlist, avis
- Espace vendeur : tableau de bord, produits et stocks, commandes (filtrables), fiche publique avec photo de couverture
- Back-office : KPI et courbe de CA, commandes, produits (masquer / republier), producteurs (validation), utilisateurs et rôles, catégories, avis, promotions, zones de livraison, newsletter (export CSV), messages, paramètres
- **Vraies photos** sans toucher au code : `npm run images:prepare` puis `npm run images:link` (voir [docs/IMAGES.md](docs/IMAGES.md))
- **Accessibilité** : contrastes WCAG AA vérifiés, navigation clavier, animations désactivées si le visiteur le demande
- Seed de démonstration réaliste (63 produits, 40 commandes, 9 producteurs…)

## 🧱 Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS · Prisma 6 · **PostgreSQL** (Neon) ·
Auth.js v5 (JWT) · Zod · Zustand · Vitest · Playwright · Déploiement Vercel.

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js ≥ 20
- npm ≥ 10
- Une base **PostgreSQL** (gratuite : [Neon](https://neon.tech) ou Supabase)

### Installation

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env
#    → renseigner DATABASE_URL, DIRECT_URL et AUTH_SECRET (voir le tableau plus bas)

# 3. Base de données
npx prisma migrate deploy   # applique prisma/migrations
npm run db:seed             # jeu de données de démonstration

# 4. Lancer l'application
npm run dev
# → http://localhost:3000
```

Réinitialisation complète (efface les données, recrée le schéma, relance le seed) :

```bash
npm run db:reset
```

### Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | URL PostgreSQL utilisée par l'application (poolée si disponible) |
| `DIRECT_URL` | oui | URL PostgreSQL directe, utilisée par `prisma migrate` |
| `AUTH_SECRET` | oui | Secret de signature des sessions Auth.js |
| `PAYMENT_WEBHOOK_SECRET` | **oui en production** | Secret HMAC du webhook de paiement (aucune valeur par défaut) |
| `CRON_SECRET` | production | Protège `/api/cron/expire-orders` |
| `PAYMENT_PROVIDER` | non | `sandbox` (défaut) ou le provider réel branché |
| `UNPAID_ORDER_TTL_MINUTES` | non | Délai avant expiration d'une commande impayée (défaut 30) |
| `NEXT_PUBLIC_APP_URL` | production | URL publique (sitemap, robots.txt, Open Graph) |
| `NEXT_PUBLIC_DEMO_MODE` | non | `true` affiche les comptes de démo sur `/connexion` |

`.env.example` est fourni ; `.env` est ignoré par Git.

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Super-administrateur | `superadmin@afrikamarket.ci` | `Afrika2026!` |
| Administrateur | `admin@afrikamarket.ci` | `Afrika2026!` |
| Modérateur | `moderation@afrikamarket.ci` | `Afrika2026!` |
| Producteur | `vendeur@afrikamarket.ci` | `Afrika2026!` |
| Client | `aya.kouassi0@mail.ci` | `Afrika2026!` |

Les e-mails des autres producteurs suivent le motif `<structure>.<ville>@afrikamarket.ci`
(ex. `saveurs.de.korhogo@afrikamarket.ci`). Avec `NEXT_PUBLIC_DEMO_MODE=true`, la liste est affichée sur `/connexion`.

> ⚠️ Ces comptes n'existent que pour la démonstration. Sur un vrai site : `NEXT_PUBLIC_DEMO_MODE` désactivé et mots de passe changés.

---

## 🧪 Commandes utiles

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (`prisma generate` + `prisma migrate deploy` + `next build`) |
| `npm run start` | Serveur de production |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests de bout en bout (Playwright) |
| `npm run typecheck` | Vérification TypeScript stricte |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Crée et applique une migration (développement) |
| `npm run db:seed` | Alimente la base de démonstration |
| `npm run db:reset` | Réinitialise la base et relance le seed |
| `npm run images:prepare` | Recadre, redimensionne et convertit en WebP les photos de `photos-source/` vers `public/images/` |
| `npm run images:link` | Rattache les photos aux produits, catégories et producteurs en base (`-- --dry` pour simuler) |

### Tests

- **Unitaires (Vitest)** : panier, promotions, livraison, stock (dont achats simultanés sur la dernière unité), commandes (création, transitions, annulation, remboursement), paiement (succès, échec, webhook invalide, webhook rejoué). Ils testent la logique métier sans base ni navigateur.
- **E2E (Playwright)** : contrôle d'accès par rôle, puis parcours d'achat complet (fiche produit → panier → checkout → paiement sandbox → confirmation) sur desktop et mobile.

```bash
npm test
npm run test:e2e                                    # lance `npm run dev` automatiquement
E2E_BASE_URL=https://afrika-market-tis9.vercel.app npm run test:e2e   # contre la démo en ligne
```

Premier lancement Playwright : `npx playwright install chromium`.
Les E2E se connectent plusieurs fois : le rate limiting (5 connexions/minute/IP) impose d'attendre une minute entre deux lancements rapprochés.

---

## 🗂 Arborescence

```text
src/
├── middleware.ts        # protection centrale de /admin, /vendeur, /compte
├── app/
│   ├── (shop)/          # vitrine publique : accueil, catalogue, fiches, panier, checkout
│   ├── (auth)/          # connexion, inscription
│   ├── (account)/       # espace client : /compte/*
│   ├── (producer)/      # espace vendeur : /vendeur/*
│   ├── (admin)/         # back-office : /admin/*
│   └── api/             # Auth.js, webhook de paiement, cron d'expiration
├── actions/             # Server Actions (validées par Zod, autorisées par rôle)
├── components/
│   ├── ui/              # primitives (bouton, champs, surfaces, retours)
│   ├── layout/          # en-tête, pied de page
│   └── features/        # composants métier (carte produit, panier, checkout…)
├── lib/
│   ├── auth/            # config Auth.js + garde de rôles
│   ├── db/              # client Prisma
│   ├── security/        # rate limiting
│   ├── services/        # logique métier pure et testable
│   ├── store/           # panier visiteur (Zustand + persist)
│   ├── utils/           # formatage FCFA, slugs, parsing…
│   └── validations/     # schémas Zod + enums de statuts
prisma/                  # schema.prisma, migrations/, seed.ts
tests/                   # tests unitaires Vitest
e2e/                     # tests Playwright
docs/SOUTENANCE.md       # questions de soutenance reliées au code
```

Détails : [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🔑 Parcours principal (Happy Path)

```text
Accueil → Découverte → Fiche produit → Fiche producteur → Panier →
Adresse → Livraison → Paiement → Confirmation → Préparation →
Expédition → Livraison → Avis
```

### Payer en mode démo

Avec `PAYMENT_PROVIDER=sandbox` (valeur par défaut), choisir Wave, Orange, MTN, Moov ou carte au checkout redirige
vers `/paiement/<référence>` : une page qui joue le rôle du prestataire (« Confirmer le paiement » ou
« Simuler un échec »). Elle fabrique un évènement **signé**, appliqué par le même code que le vrai webhook.
Le paiement à la livraison confirme directement la commande.

> Le mode sandbox n'effectue **aucun vrai débit** : c'est un choix assumé pour la démonstration. Brancher un vrai
> prestataire se fait en écrivant un adapter (voir [ARCHITECTURE.md](./ARCHITECTURE.md), §5).

Codes promotionnels de démonstration : `BIENVENUE10`, `AFRIKA20`, `LIVRAISON0`, `CAJOU1500`, `KARITE15`,
`CHOCO500`, `SOLDES10` (et `EXPIRE01`, volontairement expiré, pour illustrer les règles de validation).

---

## ☁️ Déploiement (Vercel + Neon)

1. Créer une base PostgreSQL sur Neon et noter les URL poolée et directe.
2. Importer le dépôt sur Vercel (framework Next.js détecté automatiquement).
3. Définir les variables d'environnement du tableau ci-dessus (les secrets en mode *Sensitive* ; les variables `NEXT_PUBLIC_*` en mode non sensible).
4. Déployer : le script `build` applique les migrations (`prisma migrate deploy`) puis construit l'application.
5. Alimenter la base **une seule fois** depuis un poste local (`DATABASE_URL` de production dans le `.env` local) : `npm run db:seed`.
6. Renseigner `NEXT_PUBLIC_APP_URL` avec l'URL réelle puis redéployer.

`vercel.json` programme le cron quotidien `/api/cron/expire-orders` (le palier gratuit n'autorise qu'une exécution par jour ; l'expiration est aussi appliquée à la demande).

---

## 🎨 Design et images

**Identité « le marché en couleurs »** : indigo de pagne (texte, boutons, sections sombres), jaune cajou (appels à l'action et repères), rouge kola (promotions uniquement), vert palme (origine et traçabilité), pierre claire (fond). Les titres sont en *Bricolage Grotesque* et le texte en *Figtree*, auto-hébergées par `next/font` (aucune requête vers Google côté visiteur). Les photos sont cadrées en **arches** et un bandeau de losanges tissés ponctue les sections sombres.

Toutes les couleurs passent par des *tokens* Tailwind (`brand`, `sun`, `kola`, `forest`, `earth`) définis dans `tailwind.config.ts` : changer une valeur re-thème tout le site.

**Photos** : tant qu'une photo manque, le site affiche un visuel de substitution (arche + « Photo à venir »). Le guide [docs/IMAGES.md](docs/IMAGES.md) liste les 84 fichiers attendus avec leurs noms exacts. Les liens saisis par les vendeurs sont limités à une liste d'hébergeurs (`src/config/images.ts`), partagée avec `next.config.ts`.

**Mouvement** : une scène d'entrée sur l'accueil (les arches montent l'une après l'autre), un bandeau défilant des lieux de production, des images qui apparaissent en fondu, un compteur de panier qui rebondit à l'ajout, une barre de progression vers la livraison offerte. Tout est neutralisé par `prefers-reduced-motion`.

---

## ♿ Accessibilité

- **Contrastes WCAG AA** : texte courant ≥ 4,5:1 sur tous les fonds clairs (la couleur de texte secondaire `earth-500` est à 4,8:1 minimum), texte sur fonds sombres ≥ 7:1.
- **Clavier** : lien d'évitement « Aller au contenu », contour de focus visible (jaune sur fond sombre), menus refermables avec Échap, cases à cocher et boutons radio de 20 px.
- **Structure** : un seul `h1` par page, aucun saut de niveau, une `main`, des `nav` étiquetées, `lang="fr"`.
- **Lecteurs d'écran** : boutons-icônes nommés (`aria-label`), notes en étoiles annoncées (`role="img"`), étapes de commande avec `aria-current="step"`, tableaux avec `scope="col"`.
- **Cibles tactiles** ≥ 24 px pour les boutons et liens (WCAG 2.2). Pour les cases à cocher et boutons radio (20 px), la zone cliquable est l'étiquette entière.

Pour auditer : Chrome DevTools → Lighthouse (mode mobile) sur `/`, `/produits`, une fiche produit, `/panier` et `/checkout`. Objectifs du cahier des charges : Performance ≥ 80, Accessibilité ≥ 90, SEO ≥ 90.

---

## 🔒 Sécurité

- Mots de passe hachés avec **bcrypt** (12 rounds)
- Authentification **Auth.js** (JWT), rôles portés par le token
- **Protection en deux couches** des zones privées : `middleware.ts` (avant rendu) puis `requireRole()` dans chaque page et action
- Validation **Zod** systématique côté serveur
- **Aucun prix ni montant n'est accepté depuis le navigateur** : tout est relu en base
- Décrément de stock conditionnel dans une transaction (`stock >= quantité`)
- Webhook de paiement signé en HMAC, comparaison en temps constant, traitement idempotent et atomique, montant contrôlé ; `PAYMENT_WEBHOOK_SECRET` obligatoire en production
- **Rate limiting** : connexion (5/min), inscription (5/10 min), contact (3/10 min), newsletter (5/10 min), codes promo (20/min), webhook (120/min)
- **En-têtes HTTP** : CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS
- Optimiseur d'images limité à une liste d'hébergeurs autorisés
- Pages de commande : un client ne lit que SES commandes ; un invité a besoin de son jeton de suivi
- Cloisonnement : un producteur ne voit et ne modifie que ses propres produits et commandes ; une commande **partagée** entre plusieurs producteurs n'est avancée que par l'équipe
- Actions destructrices de l'admin (annuler, rembourser, suspendre, désactiver) : confirmation avant envoi ; les règles restent contrôlées côté serveur
- Export CSV de la newsletter : route réservée au personnel, cellules neutralisées contre l'injection de formules
- Redirections de callback limitées au même hôte (anti open-redirect)
- Secrets dans `.env` (ignoré par Git), `.env.example` fourni

### Limites connues

- Le rate limiting est **en mémoire** : sur Vercel (serverless), chaque instance a son propre compteur. La limite est donc approximative ; pour une garantie globale, remplacer le stockage par Redis (Upstash) sans changer l'interface `rateLimit()`.
- L'envoi d'e-mails transactionnels n'est pas branché (prévu avec Resend).
- Le provider de paiement réel (Mobile Money) est à brancher : seul le sandbox est fourni.

---

## 📄 Licence

Projet de démonstration pédagogique. Les contenus juridiques (CGV, confidentialité, mentions légales) sont des
modèles à faire valider par un conseil avant toute mise en production.
