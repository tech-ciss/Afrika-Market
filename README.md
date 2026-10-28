# 🌍 AFRIKA MARKET

Plateforme e-commerce ouest-africaine de produits locaux, artisanaux et culturels.
Lancement en **Côte d'Ivoire**, architecture multi-pays (UEMOA), devise **XOF (FCFA)**.

> **La marketplace qui rapproche l'Afrique de ses consommateurs.**

---

## 📦 Contenu du projet

- Catalogue complet : recherche, filtres, tri, catégories et sous-catégories
- **Origine & traçabilité** : pays, région, ville, producteur, méthode de production, période de récolte
- Fiches producteurs avec validation administrative (PENDING / APPROVED / SUSPENDED / REJECTED)
- Panier persistant (base pour les comptes, localStorage pour les visiteurs) avec fusion à la connexion
- Checkout en 6 étapes, commande invité ou connecté
- **Abstraction de paiement multi-provider** (Wave, Orange Money, MTN, Moov, carte, paiement à la livraison) avec webhook signé et idempotent
- Commandes avec snapshot, matrice de transitions et suivi de livraison
- Stock décrémenté **de façon transactionnelle et conditionnelle** (pas de sur-commande), **restitué** à toute annulation/échec de paiement, et libéré automatiquement si la commande n'est pas payée à temps
- Promotions : pourcentage, montant fixe, livraison offerte, portée produit/catégorie
- Espace client : profil, adresses, commandes, wishlist, avis
- Espace vendeur : produits, stocks, commandes, statistiques
- Back-office : KPI, graphique de CA, commandes, produits, producteurs, utilisateurs, catégories, avis, promotions, zones, newsletter, messages, paramètres
- Seed de démonstration réaliste (63 produits, 40 commandes, 9 producteurs…)

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js ≥ 20 (testé sur Node 24)
- npm ≥ 10

### Installation

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env        # AUTH_SECRET est à renseigner

# 3. Base de données (SQLite en développement)
npm run db:migrate          # applique prisma/migrations
npm run db:seed             # alimente le jeu de données de démonstration

# 4. Lancer l'application
npm run dev
# → http://localhost:3000
```

En cas de réinitialisation complète :

```bash
npx prisma migrate reset --force   # recrée la base + relance le seed
```

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Super-administrateur | `superadmin@afrikamarket.ci` | `Afrika2026!` |
| Administrateur | `admin@afrikamarket.ci` | `Afrika2026!` |
| Modérateur | `moderation@afrikamarket.ci` | `Afrika2026!` |
| Producteur | `vendeur@afrikamarket.ci` | `Afrika2026!` |
| Client | `aya.kouassi0@mail.ci` | `Afrika2026!` |

Les adresses e-mail des producteurs suivent le motif `<structure>.<ville>@afrikamarket.ci`
(ex. `saveurs.de.korhogo@afrikamarket.ci`). La liste exacte est affichée sur la page `/connexion`.

---

## 🧪 Commandes utiles

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (`prisma generate` + `next build`) |
| `npm run start` | Serveur de production |
| `npm run test` | Tests unitaires (Vitest) — 107 tests |
| `npm run typecheck` | Vérification TypeScript stricte |
| `npm run lint` | ESLint (règles Next.js + TypeScript) |
| `npm run db:migrate` | Crée/applique les migrations Prisma |
| `npm run db:push` | Synchronise le schéma sans migration |
| `npm run db:seed` | Alimente le jeu de données de démonstration |
| `npm run db:reset` | Réinitialise la base et relance le seed |

---

## 🗂 Arborescence

```text
src/
├── app/
│   ├── (shop)/          # vitrine publique : accueil, catalogue, fiches, panier, checkout
│   ├── (auth)/          # connexion, inscription
│   ├── (account)/       # espace client : /compte/*
│   ├── (producer)/      # espace vendeur : /vendeur/*
│   ├── (admin)/         # back-office : /admin/*
│   └── api/             # Auth.js + webhook de paiement
├── actions/             # Server Actions (validées par Zod, autorisées par rôle)
├── components/
│   ├── ui/              # primitives (bouton, champs, surfaces, retours)
│   ├── layout/          # en-tête, pied de page
│   └── features/        # composants métier (carte produit, panier, checkout…)
├── lib/
│   ├── auth/            # config Auth.js + garde de rôles
│   ├── db/              # client Prisma
│   ├── services/        # logique métier pure et testable
│   ├── store/           # panier visiteur (Zustand + persist)
│   ├── utils/           # formatage FCFA, slugs, parsing…
│   └── validations/     # schémas Zod + enums de statuts
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
tests/                   # tests unitaires Vitest
```

Détails d'architecture : voir [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🔑 Parcours principal (Happy Path)

```text
Accueil → Découverte → Fiche produit → Fiche producteur → Panier →
Adresse → Livraison → Paiement → Confirmation → Préparation →
Expédition → Livraison → Avis
```

### Payer en mode démo

Avec `PAYMENT_PROVIDER=sandbox` (valeur par défaut), choisir Wave / Orange / MTN / Moov / carte au checkout
redirige vers `/paiement/<référence>` : une page qui joue le rôle du prestataire (« Confirmer le paiement » ou
« Simuler un échec »). Elle fabrique un évènement **signé** appliqué par le même code que le vrai webhook.
Le paiement à la livraison confirme directement la commande.

Codes promotionnels de démonstration : `BIENVENUE10`, `AFRIKA20`, `LIVRAISON0`,
`CAJOU1500`, `KARITE15`, `CHOCO500`, `SOLDES10` (et `EXPIRE01`, volontairement expiré,
pour illustrer les règles de validation).

---

## 🔒 Sécurité

- Mots de passe hachés avec **bcrypt** (10 rounds)
- Authentification **Auth.js** en stratégie JWT, rôles portés par le token
- Vérification de rôle côté serveur sur **toutes** les pages et actions protégées
- Validation **Zod** systématique côté serveur
- **Aucun prix ni montant n'est accepté depuis le navigateur** : tout est relu en base
- Décrément de stock conditionnel dans une transaction (`stock >= quantité`)
- Webhook de paiement signé en HMAC, comparaison en temps constant, traitement idempotent et atomique, montant contrôlé ; `PAYMENT_WEBHOOK_SECRET` obligatoire en production (aucun secret par défaut)
- Pages de commande : un client ne lit que SES commandes ; un invité a besoin de son jeton de suivi
- Cloisonnement des données : un producteur ne voit et ne modifie que ses propres produits/commandes
- Redirections de callback limitées au même hôte (anti open-redirect)
- Variables secrètes dans `.env` (ignoré par Git), `.env.example` fourni

---

## 📄 Licence

Projet de démonstration pédagogique. Les contenus juridiques (CGV, confidentialité, mentions
légales) sont des modèles à faire valider par un conseil avant toute mise en production.
