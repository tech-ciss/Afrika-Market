# 🏗 AFRIKA MARKET — Architecture

Document technique complémentaire au [README](./README.md) et au cahier des charges.

---

## 1. Choix techniques

| Couche | Technologie | Justification |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Rendu serveur natif pour le catalogue (SEO), Server Actions pour les mutations, groupes de routes pour isoler les espaces public / client / vendeur / admin |
| Langage | **TypeScript strict** | `strict`, `noUncheckedIndexedAccess`, statuts modélisés en unions littérales |
| UI | **Tailwind CSS** + composants maison | Design system léger, mobile-first, tokens couleur (brand / earth / forest) |
| ORM | **Prisma 6** | Schéma typé, transactions interactives pour les opérations critiques |
| Base de données | **PostgreSQL** (Neon) | Transactions ACID et verrous de ligne, nécessaires au décrément de stock atomique ; hébergement serverless gratuit pour la démo |
| Authentification | **Auth.js (NextAuth v5)** | Stratégie JWT, rôles portés par le token, provider Credentials |
| Validation | **Zod** | Schémas partagés entre formulaires, Server Actions et services |
| State client | **Zustand** (+ persist) | Uniquement pour le panier visiteur ; tout le reste vit côté serveur |
| Tests | **Vitest** + **Playwright** | Logique métier sans base ni navigateur ; parcours réels de bout en bout |
| Déploiement | **Vercel** + Neon | Intégration native Next.js, cron intégré |

Conventions de modélisation : **montants en `Int`** (le FCFA n'a pas de centime, donc pas d'erreurs d'arrondi flottant) ;
**statuts en `String`** validés par Zod et par des unions TypeScript (pas d'enum natif PostgreSQL, ce qui simplifie les évolutions).

---

## 2. Chaîne d'une requête (règle d'architecture §27)

```text
UI (composant)
  ↓
Middleware        (src/middleware.ts → filtre /admin, /vendeur, /compte)
  ↓
Server Action / Route Handler
  ↓
Rate limiting     (src/lib/security/rate-limit.ts, sur les actions sensibles)
  ↓
Authentification  (src/lib/auth/config.ts)
  ↓
Autorisation      (src/lib/auth/guards.ts → requireRole)
  ↓
Validation Zod    (src/lib/validations/*)
  ↓
Service métier    (src/lib/services/*.service.ts)
  ↓
Prisma            (src/lib/db/prisma.ts)
  ↓
PostgreSQL
```

Exemple concret — `placeOrderAction` :

1. `getCurrentUser()` (session JWT) ;
2. `checkoutSchema.safeParse()` (téléphone, e-mail, zone, mode de livraison, moyen de paiement) ;
3. `createOrder()` : relecture des lignes en base, vérification des stocks, recalcul des prix,
   application de la promotion, calcul de la livraison, puis **une seule transaction**.

---

## 3. Logique métier (testable indépendamment)

| Service | Rôle | Testé par |
|---|---|---|
| `cart.service.ts` | lignes de panier, quantités, stock, sous-total, fusion invité/connecté | `tests/cart.test.ts` |
| `promo.service.ts` | validation et calcul des remises (règles pures) | `tests/promo.test.ts` |
| `delivery.service.ts` | frais de livraison par zone, seuil de gratuité, retrait | `tests/delivery.test.ts` |
| `stock.service.ts` | décrément conditionnel transactionnel, restitution | `tests/stock.test.ts`, `tests/stock-concurrent.test.ts` |
| `order.service.ts` | création atomique, matrice de transitions, annulation, remboursement | `tests/order.test.ts`, `tests/order-lifecycle.test.ts` |
| `payment.service.ts` | abstraction provider, signature webhook, idempotence | `tests/payment.test.ts` |
| `catalog.service.ts` | recherche, filtres, tri, pagination, facettes | couvert par les E2E |
| `producer.service.ts` | statistiques publiques et privées d'un producteur | — |
| `stats.service.ts` | KPI du back-office, séries journalières | — |

Les fonctions de calcul (`validatePromo`, `computeShippingFee`, `addLine`, `canTransition`,
`decidePaymentApplication`) sont **pures** : aucune dépendance à la base, donc testables sans fixture.

---

## 4. Modèle de données

Principaux modèles Prisma : `User`, `Country`, `Producer`, `Category`, `Product`, `ProductVariant`, `Address`,
`DeliveryZone`, `DeliveryDistrict`, `Delivery`, `Order`, `OrderItem`, `OrderEvent`, `Payment`, `PromoCode`,
`Review`, `WishlistItem`, `CartItem`, `NewsletterSubscriber`, `ContactMessage`, `Setting`.

```text
Country ─┬─ Producer ── Product ── ProductVariant
         ├─ DeliveryZone ── DeliveryDistrict
         └─ User ─┬─ Address
                  ├─ CartItem / WishlistItem / Review
                  └─ Order ─┬─ OrderItem   (snapshot du produit)
                            ├─ OrderEvent  (frise de suivi)
                            ├─ Payment
                            └─ Delivery ── DeliveryZone
```

---

## 5. Paiement (§12)

```text
payment.service
  ├── createPayment()     → référence prestataire + instructions
  ├── verifyPayment()     → interrogation du prestataire
  ├── refundPayment()     → remboursement
  └── handleWebhook()     → /api/webhooks/payment (signature HMAC)
```

- `PaymentProvider` est une interface ; un registre associe `wave | orange | mtn | moov | card | cash`
  à un `ConfigurableProvider` délégué au fournisseur actif (`PAYMENT_PROVIDER`).
- Ajouter un vrai prestataire (Wave, CinetPay, FedaPay…) = écrire un adapter + l'enregistrer : **aucune logique métier n'est dupliquée**.
- Le paiement à la livraison est désactivable par zone (`DeliveryZone.allowCashOnDelivery`).
- **Le retour du navigateur ne marque jamais la commande comme payée.** Seul le webhook signé (ou `verifyPayment`)
  appelle `markOrderPaid()`, dont l'idempotence est portée par `decidePaymentApplication()` : un webhook rejoué est ignoré sans effet de bord.
- Les signatures sont comparées avec `timingSafeEqual`.
- Mode `sandbox` : la page `/paiement/[ref]` fabrique un évènement signé avec le même secret ; aucun vrai débit.

---

## 6. Commandes (§16) et stock (§31)

### Création d'une commande

```text
createOrder()
  1. résolution des lignes (panier serveur OU références envoyées par l'invité)
  2. relecture des prix et stocks EN BASE (jamais depuis le navigateur)
  3. vérification de disponibilité
  4. recalcul du sous-total
  5. validation du code promo
  6. calcul des frais de livraison (zone + mode + seuil + promo)
  7. création du n° de commande (AM-YYYYMMDD-00001) + référence de paiement
  8. TRANSACTION : commande + articles (snapshot) + paiement + livraison + évènements
        └── decrementStock() : updateMany WHERE stock >= quantité
            (échec ⇒ exception ⇒ rollback complet, jamais de stock négatif)
  9. vidage du panier du client
```

**Choix assumé** : le stock est réservé à la création de la commande (et restitué en cas d'annulation ou d'expiration),
plutôt qu'après confirmation du paiement. C'est la seule façon d'éliminer toute vente simultanée du dernier exemplaire.

### Statuts

La matrice `ORDER_TRANSITIONS` est unique et testée : une transition illégale lève une erreur plutôt que de
corrompre l'historique. Chaque changement écrit un `OrderEvent` (frise de suivi).

### Snapshot

`OrderItem` copie nom, slug, SKU, prix unitaire, quantité, image, unité, origine et producteur.
Une modification ultérieure du produit ne modifie jamais l'historique d'une commande passée.

### Cycle de vie du paiement et du stock

```text
createOrder ──(transaction : commande + stock + paiement + livraison)──► PENDING_PAYMENT
     │                                                                        │
     └─ appel du prestataire APRÈS la transaction                             │
        (échec d'initialisation ⇒ annulation + stock restitué)                │
                                                                              ▼
  webhook / page sandbox signée ──► handlePaymentEvent ─┬─ PAID  ⇒ markOrderPaid (PAID, montant vérifié)
                                                         └─ FAILED/CANCELLED ⇒ markPaymentFailed (CANCELLED + stock)
  cron /api/cron/expire-orders + à la demande ─► expireUnpaidOrders (> UNPAID_ORDER_TTL_MINUTES ⇒ cancelOrder)
```

| Situation | Comportement |
|---|---|
| Webhook reçu deux fois | `markOrderPaid` bascule par `updateMany WHERE status = PENDING_PAYMENT` : une seule requête gagne, l'autre ne change rien |
| Retour navigateur ≠ paiement | `/confirmation` est en lecture seule ; seul un évènement signé fait passer la commande à `PAID` |
| Paiement interrompu ou abandonné | `FAILED`/`CANCELLED` ou expiration ⇒ `cancelOrder` : stock restitué, paiement `FAILED` |
| Montant falsifié | Si le prestataire annonce un montant, il doit égaler `order.total`, sinon `AMOUNT_MISMATCH` |
| Annulation / remboursement | Chemin unique `closeOrder` : remboursement prestataire, bascule conditionnelle, stock restitué (sauf colis livré), paiement + livraison clôturés |
| Code promo à usage limité | Décompte incluant les commandes en attente ; invités limités par e-mail ; limites revérifiées **dans** la transaction |
| Paiement à la livraison | Commande `CONFIRMED` ; encaissée (`isPaid`) au passage à `DELIVERED` |

Limite connue : sous PostgreSQL en isolation `READ COMMITTED`, la revérification des limites de promo est une
barrière « au mieux ». Pour une garantie stricte : compteur d'usage mis à jour par `UPDATE … WHERE used < max`.

---

## 7. Panier et checkout

| Contexte | Stockage | Synchronisation |
|---|---|---|
| Visiteur | `localStorage` via Zustand (`afrika-market-cart`) | fusion au login par `syncGuestCartAction` (prix et stock relus en base) |
| Client connecté | table `CartItem` | source de vérité |

Au checkout, l'invité n'envoie que `[{ productId, variantId, quantity }]` : les montants sont toujours recalculés
par le serveur, ce qui rend le formulaire invité aussi sûr que le parcours connecté.

---

## 8. Livraison (§14-§15)

- `DeliveryZone` : tarif de base, seuil de gratuité, délai, paiement à la livraison autorisé.
- `DeliveryDistrict` : communes et quartiers rattachés à une zone (Cocody, Yopougon, Abobo…).
- `computeShippingFee()` : retrait gratuit → sinon tarif de zone → gratuit au-delà du seuil ou avec un code `FREE_SHIPPING`.
- Ajouter une ville = créer une zone (ou une commune) depuis `/admin/zones`, sans déploiement.
- Multi-pays : chaque zone référence un `Country` ; l'activation d'un pays s'administre dans `/admin/parametres`.

---

## 9. Sécurité et rôles

| Rôle | Accès |
|---|---|
| `CLIENT` | `/compte/*` : profil, adresses, commandes, wishlist, avis |
| `PRODUCER` | `/vendeur/*` : ses produits, ses stocks, ses lignes de commande, sa fiche |
| `ADMIN` | `/admin/*` : pilotage complet de la plateforme |
| `SUPER_ADMIN` | `ADMIN` + rôles, pays, paramètres globaux |

### Défense en profondeur

1. **`src/middleware.ts`** : lit le JWT (compatible Edge, sans accès base). Un visiteur est renvoyé vers `/connexion?callbackUrl=…` ;
   un utilisateur au rôle insuffisant est renvoyé vers son propre espace.
2. **`requireRole()`** : appelé en tête de chaque page protégée et de chaque action sensible. Si le middleware était contourné ou mal configuré, cette couche protège encore.
3. **Filtrage par propriétaire** : chaque requête est limitée par `producerId` ou `userId`. Un producteur ne peut ni lire ni modifier les données d'un confrère.

### Autres protections

- **Rate limiting** (`src/lib/security/rate-limit.ts`) : fenêtre fixe, clé = portée + IP.
  Limites : connexion 5/min, inscription 5/10 min, contact 3/10 min, newsletter 5/10 min, codes promo 20/min, webhook 120/min.
  *Limite* : stockage en mémoire, donc par instance serverless ; pour un compteur global, remplacer par Redis (Upstash) derrière la même signature.
- **En-têtes HTTP** (`next.config.ts`) : CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Images** : l'optimiseur n'accepte que les hôtes déclarés dans `remotePatterns` (pas de proxy ouvert) ; les SVG sont servis sous CSP `sandbox`.
- **Mots de passe** : bcrypt, 12 rounds.
- **Validation Zod** systématique, y compris sur les données d'invité.
- **Anti open-redirect** sur les `callbackUrl`.
- **Secrets** : uniquement via variables d'environnement ; le webhook refuse de démarrer en production sans `PAYMENT_WEBHOOK_SECRET`.

---

## 10. API HTTP

L'essentiel des mutations passe par des Server Actions (pas d'API REST publique). Les points d'entrée HTTP sont :

| Route | Méthode | Rôle | Protection |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Auth.js (connexion, session, déconnexion) | CSRF Auth.js |
| `/api/webhooks/payment` | POST | Évènements du prestataire de paiement | signature HMAC, rate limit, idempotence |
| `/api/cron/expire-orders` | GET | Annule les commandes impayées expirées et restitue le stock | `Authorization: Bearer $CRON_SECRET` |
| `/admin/newsletter/export` | GET | Export CSV des abonnés actifs (UTF-8 avec BOM, séparateur `;`) | rôle ADMIN / SUPER_ADMIN |

Webhook : le corps JSON décrit l'évènement (référence de paiement, statut, montant éventuel) et la signature HMAC-SHA256
est transmise dans l'en-tête `x-afrika-signature`. Réponses :

| Code | Signification |
|---|---|
| `200` | évènement traité, ou déjà traité (idempotent) |
| `400` | évènement invalide ou refusé (par exemple `AMOUNT_MISMATCH`) |
| `401` | signature invalide |
| `404` | commande introuvable |
| `409` | conflit de concurrence, le prestataire peut réessayer |
| `429` | trop de requêtes (rate limiting) |
| `500` | erreur de traitement |

---

## 11. Performance et SEO

- Rendu serveur par défaut, états de chargement visuels (skeletons) sur les vues longues ;
- `generateMetadata()` dynamique sur les fiches produit, catégories et producteurs ;
- Open Graph, `sitemap.xml`, `robots.txt` (espaces privés exclus), URLs par slug ;
- pagination serveur (12 produits par page), pas de requête N+1 (includes Prisma ciblés) ;
- images via `next/image` (WebP/AVIF, tailles responsives, `priority` sur l'image principale) ; polices auto-hébergées (`next/font`, `display: swap`) ;
- `SmartImage` : fondu à l'arrivée et repli sur le visuel de substitution si une photo est introuvable ;
- animations en CSS pur (aucune bibliothèque d'animation), désactivées par `prefers-reduced-motion`.

---

## 11 bis. Design system et images

**Tokens** (`tailwind.config.ts`) : `brand` (indigo), `sun` (jaune cajou), `kola` (rouge, promotions), `forest` (vert, origine), `earth` (neutres). Les composants n'emploient jamais de couleur Tailwind par défaut : tout passe par ces tokens.

**Briques réutilisables** :

| Composant | Usage |
|---|---|
| `ui/smart-image` | image du site : fondu + repli |
| `ui/page-header`, `ui/stat` (`StatStrip`, `DataTable`), `ui/bar-list`, `ui/filter-chips` | pages vendeur et admin |
| `ui/summary-card`, `features/checkout-steps` | panier, checkout, confirmation |
| `ui/confirm-button` | confirmation avant action destructrice |
| `layout/dashboard-nav` | navigation latérale vendeur (claire) et admin (sombre, par sections) |
| `features/image-preview-field` | champ « lien d'image » avec aperçu |

**Pipeline d'images** : `public/images/<type>/<slug>.webp` (+ `--2`, `--3` pour la galerie, `--cover` pour le bandeau producteur). `prisma/image-files.ts` détecte les photos présentes ; le seed les utilise, sinon génère un SVG de substitution ; `scripts/prepare-images.ts` (sharp) recadre et convertit ; `scripts/link-images.ts` met la base à jour sans la réinitialiser.

**Organisation des espaces** : le vendeur et l'admin partagent la même structure (barre latérale + `PageHeader` en `h1` + sections en `h2`). Les listes filtrables utilisent des paramètres d'URL (`?statut=`, `?q=`, `?edit=`) : les vues sont partageables et fonctionnent sans JavaScript.

---

## 12. Tests

| Niveau | Outil | Couverture |
|---|---|---|
| Unitaire | Vitest | panier, promotions, livraison, stock (dont achats simultanés), commandes, paiement (succès, échec, webhook invalide, webhook rejoué) |
| Unitaire | Vitest | détection des photos locales et lecture des images produit (`tests/images.test.ts`) |
| E2E | Playwright | contrôle d'accès par rôle ; parcours d'achat complet sandbox (desktop + mobile) |

Le test d'achats simultanés (`tests/stock-concurrent.test.ts`) simule l'atomicité d'un `UPDATE … WHERE stock >= n` : il vérifie que la logique
n'effectue pas de lecture puis d'écriture séparées. Il ne remplace pas un test d'intégration sur un vrai PostgreSQL.

---

## 13. Déploiement

```text
GitHub ──push──► Vercel (build : prisma generate && prisma migrate deploy && next build)
                    │
                    ├── Next.js (serverless) ──► Neon PostgreSQL (URL poolée à l'exécution, URL directe pour les migrations)
                    └── Cron quotidien ──► /api/cron/expire-orders
```

Procédure détaillée et variables d'environnement : voir le [README](./README.md#️-déploiement-vercel--neon).

---

## 14. Évolutions prévues (hors MVP)

1. **Paiement réel** : adapter Wave / CinetPay / FedaPay derrière `PaymentProvider`.
2. **Rate limiting global** : Redis (Upstash).
3. **E-mails transactionnels** : Resend, déclenchés par les `OrderEvent`.
4. **Multi-pays** : activation des pays UEMOA et des zones associées.
5. **Multi-devise** : colonne `currency` déjà présente sur `Product`, `Order`, `Payment`.
6. **Notifications WhatsApp/SMS** : `OrderEvent` fournit déjà le jalon de chaque transition.
7. **QR code produit** : URL publique `/produits/<slug>` stable.
8. **PWA** : shell public rendu côté serveur, compatible manifest.
9. **Recherche avancée** : `buildCatalogWhere()` est isolé, remplaçable par un index dédié.
