# 🏗 AFRIKA MARKET — Architecture

Document technique complémentaire au [README](./README.md) et au cahier des charges.

---

## 1. Choix techniques

| Couche | Technologie | Justification |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Rendu serveur natif pour le catalogue (SEO), Server Actions pour les mutations, segments de route pour isoler les espaces public / client / vendeur / admin |
| Langage | **TypeScript strict** | `strict`, `noUncheckedIndexedAccess`, statuts modélisés en union littérale |
| UI | **Tailwind CSS** + composants maison | Design system léger, mobile-first, tokens couleur (brand / earth / forest) |
| ORM | **Prisma** | Schéma typé, transactions interactives pour les opérations critiques |
| Base de données | **SQLite en dev** (migrations versionnées) | Le schéma est volontairement portable vers **PostgreSQL** en production : pas d'enum natif (statuts en `String` + validation Zod), montants en `Int` (le FCFA n'a pas de centime) |
| Authentification | **Auth.js (NextAuth v5)** | Stratégie JWT, rôles portés par le token, provider Credentials |
| Validation | **Zod** | Schémas partagés entre formulaires, Server Actions et services |
| State client | **Zustand** (+ persist) | Uniquement pour le panier visiteur ; tout le reste vit côté serveur |
| Tests | **Vitest** | Tests unitaires de la logique métier, sans base ni navigateur |

### Adaptation à l'environnement Cloudflare (Sites)

Le code suit déjà la couche d'abstraction attendue :

- toute la logique métier est dans `src/lib/services/*` ;
- l'accès base passe par `src/lib/db/prisma.ts` (singleton).

Pour un déploiement Workers, il suffit d'activer l'adaptateur de driver Prisma
(`@prisma/adapter-d1` ou `@prisma/adapter-libsql`) et de fournir `DATABASE_URL` ;
aucune règle métier n'a à changer. La base PostgreSQL managée reste l'option de
production cible par le cahier des charges.

---

## 2. Chaîne d'une requête (règle d'architecture §27)

```text
UI (composant)
  ↓
Server Action / Route Handler
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
Base de données
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
| `stock.service.ts` | décrément conditionnel transactionnel, restitution | `tests/stock.test.ts` |
| `order.service.ts` | création atomique, matrice de transitions, annulation, remboursement | `tests/order.test.ts` |
| `payment.service.ts` | abstraction provider, signature webhook, idempotence | `tests/payment.test.ts` |
| `catalog.service.ts` | recherche, filtres, tri, pagination, facettes | — |
| `producer.service.ts` | statistiques publiques et privées d'un producteur | — |
| `stats.service.ts` | KPI du back-office, séries journalières | — |

Les fonctions de calcul (`validatePromo`, `computeShippingFee`, `addLine`, `canTransition`,
`decidePaymentApplication`) sont **pures** : aucune dépendance à la base, donc testables sans fixture.

---

## 4. Commandes (§16) et stock (§31)

### Création d'une commande

```text
createOrder()
  1. résolution des lignes (panier serveur OU références envoyées par l'invité)
  2. relecture des prix et stocks EN BASE (jamais depuis le navigateur)
  3. vérification de disponibilité
  4. recalcul du sous-total
  5. validation du code promo (evaluatePromoCode)
  6. calcul des frais de livraison (zone + mode + seuil + promo)
  7. création du n° de commande (AM-YYYYMMDD-00001) + référence de paiement
  8. TRANSACTION : commande + articles (snapshot) + paiement + livraison + évènements
        └── decrementStock() : updateMany WHERE stock >= quantité
            (échec ⇒ exception ⇒ rollback complet, jamais de stock négatif)
  9. vidage du panier du client
```

**Choix assumé** : le stock est réservé à la création de la commande (et restitué en cas
d'annulation/expiration), plutôt qu'après confirmation de paiement. C'est la seule façon
d'éliminer toute vente simultanée sur le dernier exemplaire ; le cahier des charges exige
explicitement que cette question soit answerable en soutenance (§40 « Comment éviter
qu'un produit soit vendu deux fois ? »).

### Statuts

La matrice `ORDER_TRANSITIONS` est unique et testée : une transition illégale lève une erreur
plutôt que de corrompre l'historique. Chaque changement écrit un `OrderEvent` (frise de suivi).

### Snapshot

`OrderItem` copie nom, slug, SKU, prix unitaire, quantité, image, unité, origine et producteur.
Une modification ultérieure du produit ne modifie jamais l'historique d'une commande passée.

---

## 5. Paiement (§12)

```text
payment.service
  ├── createPayment()     → référence prestataire + instructions
  ├── verifyPayment()     → interrogation du prestataire
  ├── refundPayment()     → remboursement
  └── handleWebhook()     → /api/webhooks/payment (signature HMAC)
```

- `PaymentProvider` est une interface ; `registry` mappe `wave | orange | mtn | moov | card | cash`
  vers un `ConfigurableProvider` délégué au fournisseur actif (`PAYMENT_PROVIDER`).
- Ajouter un vrai prestataire = écrire un adapter + l'enregistrer : **aucune logique métier
  n'est dupliquée**.
- Le paiement à la livraison est désactivable par zone (`DeliveryZone.allowCashOnDelivery`).
- **Le retour du navigateur ne marque jamais la commande comme payée.** Seul le webhook signé
  (ou `verifyPayment`) appelle `markOrderPaid()`, dont l'idempotence est portée par
  `decidePaymentApplication()` : un webhook rejoué est ignoré sans effet de bord.
- Les signatures sont comparées avec `timingSafeEqual`.

---

## 6. Panier et checkout

| Contexte | Stockage | Synchronisation |
|---|---|---|
| Visiteur | `localStorage` via Zustand (`afrika-market-cart`) | fusion au login par `syncGuestCartAction` (prix et stock relus en base) |
| Client connecté | table `CartItem` | source de vérité |

Au checkout, l'invité n'envoie que `[{ productId, variantId, quantity }]` : les montants sont
toujours recalculés par le serveur, ce qui rend le formulaire invité aussi sûr que le parcours connecté.

---

## 7. Livraison (§14-§15)

- `DeliveryZone` : tarif de base, seuil de gratuité, délai, paiement à la livraison autorisé.
- `DeliveryDistrict` : communes/quartiers rattachés à une zone (Cocody, Yopougon…).
- `computeShippingFee()` : retrait gratuit → sinon tarif de zone → gratuit au-delà du seuil
  ou avec un code `FREE_SHIPPING`.
- Ajouter une ville = créer une zone (ou une commune) depuis `/admin/zones`, sans déploiement.
- Multi-pays : chaque zone référence un `Country` ; l'activation d'un pays s'administre dans
  `/admin/parametres` (bonus 2).

---

## 8. Sécurité et rôles

| Rôle | Accès |
|---|---|
| `CLIENT` | `/compte/*` : profil, adresses, commandes, wishlist, avis |
| `PRODUCER` | `/vendeur/*` : ses produits, ses stocks, ses lignes de commande, sa fiche |
| `ADMIN` | `/admin/*` : pilotage complet de la plateforme |
| `SUPER_ADMIN` | `ADMIN` + rôles, pays, paramètres globaux |

Points d'attention implémentés :

- `requireRole()` est appelé en tête de chaque page protégée et de chaque action sensible ;
- chaque ressource est filtrée par propriétaire (`producerId`, `userId`) — un producteur ne
  peut ni lire ni modifier les données d'un confrère ;
- validation Zod systématique, y compris sur les données d'invité ;
- contrôle anti open-redirect sur les `callbackUrl` ;
- rate limiting et envoi d'e-mails transactionnels : branches prévues, à brancher sur un
  prestataire (Resend) en production.

---

## 9. Performance et SEO

- Rendu serveur par défaut, `loading`-states visuels (skeletons) sur les vues longues ;
- `generateMetadata()` dynamique sur les fiches produit, catégories et producteurs ;
- Open Graph, `sitemap.xml`, `robots.txt` (espaces privés exclus), URLs par slug ;
- pagination serveur (12 produits/page), pas de requête N+1 (includes Prisma ciblés) ;
- images locales en SVG générées par le seed : aucun appel réseau à l'affichage.

---

## 10. Évolutions prévues (hors MVP)

1. **Paiement réel** : adapter Wave / CinetPay / FedaPay derrière `PaymentProvider`.
2. **Multi-pays** : activation des pays UEMOA + zones associées.
3. **Multi-devise** : colonne `currency` déjà présente sur `Product`, `Order`, `Payment`.
4. **Notifications WhatsApp/SMS** : `OrderEvent` fournit déjà le jalon de chaque transition.
5. **QR code produit** : URL publique `/produits/<slug>` stable, à générer côté producteur.
6. **PWA** : le shell public est statique côté serveur, compatible manifest.
7. **Recherche avancée** : `buildCatalogWhere()` est isolé, remplaçable par un index dédié.

---

## 4. Cycle de vie du paiement et du stock

Le stock est **réservé** à la création de la commande (décrément conditionnel dans la transaction),
puis **restitué** une seule fois quand la commande se termine sans livraison.

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

Règles à retenir (questions de soutenance §40) :

| Question | Réponse dans le code |
|---|---|
| Webhook reçu deux fois ? | `markOrderPaid` bascule par `updateMany WHERE status = PENDING_PAYMENT` : une seule requête gagne, l'autre ne change rien. |
| Retour navigateur ≠ paiement ? | `/confirmation` est en lecture seule ; seul un évènement signé fait passer la commande à `PAID`. |
| Paiement interrompu / abandonné ? | `FAILED`/`CANCELLED` ou expiration ⇒ `cancelOrder` : stock restitué, paiement `FAILED`. |
| Montant falsifié ? | Si le prestataire annonce un montant, il doit égaler `order.total`, sinon `AMOUNT_MISMATCH`. |
| Annulation / remboursement ? | Chemin unique `closeOrder` : remboursement prestataire, bascule conditionnelle, stock restitué (sauf colis livré), paiement + livraison clôturés. `transitionOrder(CANCELLED/REFUNDED/PAID)` y est routé : aucun statut financier ne passe par un simple `update`. |
| Code promo à usage limité ? | Décompte incluant les commandes en attente ; invités limités par e-mail ; limites revérifiées **dans** la transaction de création. |
| Paiement à la livraison ? | Commande `CONFIRMED` ; encaissée (`isPaid`) au passage à `DELIVERED`. |

Limite connue : sous PostgreSQL en isolation `READ COMMITTED`, la revérification des limites de promo
est une barrière « au mieux » ; pour une garantie stricte, ajouter un compteur d'usage mis à jour par
`UPDATE … WHERE used < max` (prévu avec la migration PostgreSQL).
