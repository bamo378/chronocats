# ChronoCats

**Construis ton monde, maîtrise les livrets !**

Jeu éducatif pour apprendre les livrets (tables de multiplication) de 1 à 12, pensé pour Anaëlle et Alice (11 ans). Principalement pour iPad, fonctionne aussi sur smartphone et ordinateur. Installable sur l’écran d’accueil (PWA).

## Ce que contient le jeu

ChronoCats fait travailler **les livrets de 1 à 12, jusqu’à × 12**, avec une interface sombre et moderne pensée pour l’iPad (rail de navigation à gauche) et le téléphone (barre en bas).

- **Livrets** (écran principal) : 1) choisir un ou plusieurs livrets de 1 à 12 ; 2) choisir un mode :
  - **S’entraîner** : 20 questions avec astuces et deuxième chance ; chaque bonne réponse rapporte des points au livret (bonus de série). Médailles par livret : bronze 150, argent 400, or 800 points.
  - **Tester mes connaissances** : sans aide ni deuxième essai, réponses tapées ; 90 % de réussite sur un livret = son diplôme.
  - En plus : revoir un livret, mes erreurs, défi du jour, objectif du jour.
- **Jeux** (sur les livrets choisis) : Éclair (60 s), Survie (3 vies, chrono par calcul qui raccourcit), Bulles (éclater la bonne réponse), Memory (paires calcul–résultat), Vrai ou faux (45 s). Records personnels.
- **Arène** : Duel sur le même écran (chacune sur ses propres livrets, l’iPad posé à plat se partage en deux), Défi du jour (20 calculs identiques pour les deux sœurs, premier essai seulement), Objectif commun de la semaine (600 bonnes réponses à deux → récompense pour les deux îles), tableau des records.
- **Progrès** : niveau, précision, la grande table 12 × 12 colorée calcul par calcul, maîtrise de chaque livret, badges.
- **Mon île** : construction en voxels avec les pièces et cubes gagnés, chat compagnon personnalisable.
- **Moteur pédagogique** : suivi de chaque calcul (les calculs ratés reviennent plus souvent), erreurs typiques repérées, explication et nouvel essai, révisions espacées, test de niveau au départ. La vitesse des jeux ne compte jamais pour valider un livret.
- **Espace parents** protégé par code ; aucune publicité, aucun achat, aucune pénalité en cas d’absence.

Le jeu des livrets (tables de multiplication) reste disponible sur `/livret/`.

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests du moteur pédagogique
npm run build    # version de production dans dist/
```

## Mise en ligne

Le jeu est publié avec **GitHub Pages** : chaque push sur `main` lance `.github/workflows/pages.yml`, qui teste, construit et publie sur https://bamo378.github.io/chronocats/.
Le fichier `netlify.toml` reste prêt si l’on veut passer par Netlify.

## Sauvegardes

Phase 1 : sauvegarde locale sur l’appareil (une clé par enfant, jamais mélangées). Le format est prêt pour une synchronisation cloud (Supabase, avec compte parent et profils enfants internes) en phase 2.

## Organisation du code

```
src/engine/    moteur pédagogique : livrets, exercices, maîtrise, suivi des calculs, révisions, diagnostic (+ tests)
src/game/      catalogue d'objets, accessoires, jeux, récompenses
src/profiles/  profils, sauvegarde, réglages parents
src/components/ icônes, éléments d'interface, chat, île isométrique, exercices, leçons, effets
src/screens/   profils, création du chat, test de niveau, séances, onglets (hub/), parents
src/games/     Éclair, Survie, Bulles, Memory, Vrai ou faux, Duel, Défi du jour
```

Le moteur est indépendant de l’affichage : on pourra y ajouter d’autres matières (maths, lecture) plus tard.

## Prochaines étapes (phases 2 et 3)

Missions quotidiennes structurées, synchronisation cloud, Arène des défis entre sœurs, collection de chats, nouvelles îles et constructions, tableau de bord parent enrichi.
