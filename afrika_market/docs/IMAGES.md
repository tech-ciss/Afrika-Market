# Guide des photos

Le site fonctionne avec des visuels de substitution (arche + « Photo à venir »). Ce guide explique comment les remplacer par de vraies photos, **sans toucher au code ni réinitialiser la base**.

## En 3 commandes

```bash
# 1. Dépose tes photos d'origine (n'importe quel poids) dans photos-source/, nommées comme dans les tableaux ci-dessous
#    photos-source/products/<slug>.jpg   photos-source/categories/<slug>.jpg   photos-source/producers/<slug>.jpg

npm run images:prepare      # (utilise sharp, déjà installé avec Next.js) recadre intelligemment, redimensionne, convertit en WebP → public/images/…
npm run images:link         # rattache les photos aux produits en base (ajoute -- --dry pour simuler)
```

Pour **la base de production** : lance `images:link` avec le `DATABASE_URL` de production (les commandes et les comptes ne sont pas touchés), puis `git add public/images && git push`.
Si tu réinitialises la base avec `npm run db:seed`, les photos présentes dans `public/images/` sont reprises automatiquement.

## Règles de nommage

| Élément | Fichier | Exemple |
|---|---|---|
| Photo principale d'un produit | `<slug>.jpg` | `beurre-de-karite-pur-100-200-g.jpg` |
| Photos supplémentaires (galerie) | `<slug>--2.jpg`, `<slug>--3.jpg`… | `…-200-g--2.jpg` |
| Catégorie | `<slug>.jpg` | `cacao-chocolat.jpg` |
| Logo / portrait producteur | `<slug>.jpg` | `maison-du-karite.jpg` |
| Bandeau de la page producteur | `<slug>--cover.jpg` | `maison-du-karite--cover.jpg` |

La 2e photo d'un produit s'affiche au survol dans les listes ; toutes alimentent la galerie de la fiche produit.

## Conseils de prise de vue

- **Produits** : lumière du jour près d'une fenêtre, fond uni ou matière naturelle (bois, tissu, pagne), produit au centre avec de la marge : le recadrage est automatique (carré, avec zone de sécurité sur les bords).
- **Catégories** : photos verticales (3:4), une ambiance plutôt qu'un seul produit (ex. cacao : cabosses et fèves).
- **Producteurs** : portrait ou logo carré ; bandeau en paysage (16:9) : champ, atelier, coopérative.
- Montrer l'**origine** : mains, plantation, atelier. C'est la promesse du site (§8 du cahier des charges).

## D'où viennent les photos ?

1. **Les producteurs eux-mêmes** : les meilleures photos pour un site de traçabilité, et gratuites. Demande 3 photos par produit (produit, emballage, fabrication).
2. **Banques libres de droits** : Unsplash, Pexels, Pixabay (licences gratuites ; vérifie que la photo montre bien le produit local et pas un équivalent d'ailleurs). Garde le nom de l'auteur dans tes crédits.
3. Ne jamais prendre une image trouvée au hasard sur Google : droits d'auteur.

## Fichiers à fournir

Coche au fur et à mesure. `npm run images:link` affiche aussi la liste de ce qui manque.


### Catégories (12)

| ☐ | Fichier | Catégorie |
|---|---|---|
| ☐ | `alimentation.jpg` | Alimentation |
| ☐ | `boissons.jpg` | Boissons |
| ☐ | `epices-condiments.jpg` | Épices & condiments |
| ☐ | `fruits-noix.jpg` | Fruits & noix |
| ☐ | `cacao-chocolat.jpg` | Cacao & chocolat |
| ☐ | `cafe-the.jpg` | Café & thé |
| ☐ | `miel-confitures.jpg` | Miel & confitures |
| ☐ | `cereales-legumineuses.jpg` | Céréales & légumineuses |
| ☐ | `cosmetique-naturelle.jpg` | Cosmétique naturelle |
| ☐ | `artisanat-decoration.jpg` | Artisanat & décoration |
| ☐ | `coffrets-cadeaux.jpg` | Coffrets cadeaux |
| ☐ | `coco.jpg` | Coco |

### Producteurs (9)

| ☐ | Logo / portrait | Bandeau (optionnel) | Producteur |
|---|---|---|---|
| ☐ | `cooperative-cacao-de-soubre.jpg` | `cooperative-cacao-de-soubre--cover.jpg` | Coopérative Cacao de Soubré |
| ☐ | `maison-du-karite.jpg` | `maison-du-karite--cover.jpg` | Maison du Karité |
| ☐ | `saveurs-de-korhogo.jpg` | `saveurs-de-korhogo--cover.jpg` | Saveurs de Korhogo |
| ☐ | `terroirs-de-soubre.jpg` | `terroirs-de-soubre--cover.jpg` | Terroirs de Soubré |
| ☐ | `artisans-d-abidjan.jpg` | `artisans-d-abidjan--cover.jpg` | Artisans d'Abidjan |
| ☐ | `cafe-de-man.jpg` | `cafe-de-man--cover.jpg` | Café de Man |
| ☐ | `mia-faso-cereales.jpg` | `mia-faso-cereales--cover.jpg` | Mia Faso Céréales |
| ☐ | `cocotiers-d-assinie.jpg` | `cocotiers-d-assinie--cover.jpg` | Cocotiers d'Assinie |
| ☐ | `miellerie-du-bandama.jpg` | `miellerie-du-bandama--cover.jpg` | Miellerie du Bandama |

### Produits (63)


**Coopérative Cacao de Soubré**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `feves-de-cacao-torrefiees-500-g.jpg` | Fèves de cacao torréfiées 500 g | Soubré |
| ☐ | `chocolat-noir-70-tablette-100-g.jpg` | Chocolat noir 70 % - tablette 100 g | Soubré |
| ☐ | `chocolat-au-lait-noix-de-cajou.jpg` | Chocolat au lait & noix de cajou | Soubré |
| ☐ | `poudre-de-cacao-pure-250-g.jpg` | Poudre de cacao pure 250 g | Soubré |
| ☐ | `coffret-decouverte-cacao.jpg` | Coffret Découverte Cacao | Soubré |

**Maison du Karité**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `beurre-de-karite-pur-100-200-g.jpg` | Beurre de karité pur 100 % - 200 g | Korhogo |
| ☐ | `beurre-de-karite-cocoa-butter.jpg` | Beurre de karité & cocoa butter | Korhogo |
| ☐ | `savon-noir-africain-traditionnel.jpg` | Savon noir africain traditionnel | Korhogo |
| ☐ | `savon-karite-huile-de-coco.jpg` | Savon karité & huile de coco | Korhogo |
| ☐ | `huile-de-karite-pour-cheveux-100-ml.jpg` | Huile de karité pour cheveux 100 ml | Korhogo |
| ☐ | `coffret-rituel-karite.jpg` | Coffret Rituel Karité | Korhogo |

**Saveurs de Korhogo**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `noix-de-cajou-premium-500-g.jpg` | Noix de cajou premium 500 g | Korhogo |
| ☐ | `cajou-grille-au-sel-de-mer.jpg` | Cajou grillé au sel de mer | Korhogo |
| ☐ | `piment-moulu-de-korhogo-80-g.jpg` | Piment moulu de Korhogo 80 g | Korhogo |
| ☐ | `poivre-de-guinee-piment-long.jpg` | Poivre de Guinée (piment long) | Korhogo |
| ☐ | `melange-epices-pour-braise-150-g.jpg` | Mélange épices pour braisé 150 g | Korhogo |
| ☐ | `noix-de-cajou-cassees-250-g.jpg` | Noix de cajou cassées 250 g | Korhogo |

**Terroirs de Soubré**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `huile-de-palme-rouge-1-l.jpg` | Huile de palme rouge 1 L | Soubré |
| ☐ | `gari-de-manioc-soyeux-1-kg.jpg` | Gari de manioc soyeux 1 kg | Soubré |
| ☐ | `banane-plantain-sechee-500-g.jpg` | Banane plantain séchée 500 g | Soubré |
| ☐ | `sauce-graine-de-courge-400-g.jpg` | Sauce graine de courge 400 g | Soubré |
| ☐ | `ananas-seche-de-soubre-150-g.jpg` | Ananas séché de Soubré 150 g | Soubré |

**Artisans d'Abidjan**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `panier-tresse-en-raphia-moyen.jpg` | Panier tressé en raphia moyen | Abidjan |
| ☐ | `panier-tresse-grand-format.jpg` | Panier tressé grand format | Abidjan |
| ☐ | `coussin-bogolan-lot-de-2.jpg` | Coussin bogolan - lot de 2 | Abidjan |
| ☐ | `couverture-kente-tissee-200-240-cm.jpg` | Couverture kente tissée 200×240 cm | Abidjan |
| ☐ | `bol-en-bois-d-iroko-grave.jpg` | Bol en bois d'Iroko gravé | Abidjan |
| ☐ | `coffret-artisanat-d-abidjan.jpg` | Coffret Artisanat d'Abidjan | Abidjan |

**Café de Man**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `cafe-arabica-grains-500-g.jpg` | Café arabica grains 500 g | Man |
| ☐ | `cafe-moulu-filtre-250-g.jpg` | Café moulu filtre 250 g | Man |
| ☐ | `cafe-decafeine-a-l-eau-250-g.jpg` | Café décaféiné à l'eau 250 g | Man |
| ☐ | `infusion-bissap-gingembre-100-g.jpg` | Infusion bissap & gingembre 100 g | Man |

**Mia Faso Céréales**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `riz-parfume-de-katiola-5-kg.jpg` | Riz parfumé de Katiola 5 kg | Katiola |
| ☐ | `riz-complet-1-kg.jpg` | Riz complet 1 kg | Katiola |
| ☐ | `niebe-blanc-1-kg.jpg` | Niébé blanc 1 kg | Katiola |
| ☐ | `arachides-decortiquees-500-g.jpg` | Arachides décortiquées 500 g | Katiola |
| ☐ | `mais-souffle-local-400-g.jpg` | Maïs soufflé local 400 g | Katiola |

**Cocotiers d'Assinie**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `huile-de-coco-vierge-500-ml.jpg` | Huile de coco vierge 500 ml | Assinie |
| ☐ | `lait-de-coco-400-ml.jpg` | Lait de coco 400 ml | Assinie |
| ☐ | `sucre-de-coco-500-g.jpg` | Sucre de coco 500 g | Assinie |
| ☐ | `coco-fraiche-pressee-pack-de-6.jpg` | Coco fraîche pressée - pack de 6 | Assinie |

**Miellerie du Bandama**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `miel-de-fleurs-500-g.jpg` | Miel de fleurs 500 g | Gagnoa |
| ☐ | `miel-de-foret-500-g.jpg` | Miel de forêt 500 g | Gagnoa |
| ☐ | `confiture-de-mangue-kent-350-g.jpg` | Confiture de mangue Kent 350 g | Gagnoa |
| ☐ | `pate-a-tartiner-cacao-karite.jpg` | Pâte à tartiner cacao & karité | Gagnoa |

**Terroirs de Soubré**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `jus-de-gingembre-presse-1-l.jpg` | Jus de gingembre pressé 1 L | Soubré |

**Miellerie du Bandama**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `bissap-naturel-1-l.jpg` | Bissap naturel 1 L | Gagnoa |

**Café de Man**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `the-vert-citron-vert-100-g.jpg` | Thé vert & citron vert 100 g | Man |

**Saveurs de Korhogo**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `beignets-de-haricot-farine-1-kg.jpg` | Beignets de haricot - farine 1 kg | Korhogo |

**Mia Faso Céréales**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `attieke-de-manioc-1-kg.jpg` | Attieké de manioc 1 kg | Katiola |

**Terroirs de Soubré**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `poudre-d-ebene-haricot-noir.jpg` | Poudre d'ébène (haricot noir) | Soubré |

**Cocotiers d'Assinie**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `noix-de-coco-sechee-250-g.jpg` | Noix de coco séchée 250 g | Assinie |

**Maison du Karité**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `savon-de-marseille-noir-lot-de-3.jpg` | Savon de Marseille noir - lot de 3 | Korhogo |

**Artisans d'Abidjan**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `sac-a-main-en-raphia-tresse.jpg` | Sac à main en raphia tressé | Abidjan |

**Coopérative Cacao de Soubré**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `chocolat-blanc-cajou.jpg` | Chocolat blanc & cajou | Soubré |

**Saveurs de Korhogo**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `gingembre-moulu-80-g.jpg` | Gingembre moulu 80 g | Korhogo |

**Miellerie du Bandama**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `miel-propolis-250-g.jpg` | Miel & propolis 250 g | Gagnoa |

**Mia Faso Céréales**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `sagam-extra-fin-1-kg.jpg` | Sagam extra fin 1 kg | Katiola |

**Cocotiers d'Assinie**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `farine-de-coco-500-g.jpg` | Farine de coco 500 g | Assinie |

**Café de Man**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `cafe-en-grains-ethiopien-edition-limitee.jpg` | Café en grains éthiopien - édition limitée | Man |

**Artisans d'Abidjan**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `couverts-en-bois-set-de-4.jpg` | Couverts en bois - set de 4 | Abidjan |

**Terroirs de Soubré**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `cacao-pasta-250-g.jpg` | Cacao pasta 250 g | Soubré |

**Maison du Karité**

| ☐ | Fichier | Produit | Origine |
|---|---|---|---|
| ☐ | `masque-visage-argile-karite.jpg` | Masque visage argile & karité | Korhogo |
