# ChronoCats

**Construis ton monde, maîtrise les livrets !**

Jeu éducatif pour apprendre les livrets (tables de multiplication) de 1 à 12, pensé pour Anaëlle et Alice (11 ans). Principalement pour iPad, fonctionne aussi sur smartphone et ordinateur. Installable sur l’écran d’accueil (PWA).

## Ce que contient le jeu

ChronoCats fait travailler **les livrets de 1 à 12, jusqu’à × 12**.

- **Deux profils séparés** (Anaëlle, Alice) : chat, ville, pièces, cubes, étoiles, records et progression propres à chacune.
- **Chat compagnon** : nom, 6 pelages, accessoires débloqués en maîtrisant des livrets, animations et réactions.
- **Diagnostic « Le Grand Réveil »** : chaque livret réussi rallume un cristal ; l’enfant commence au bon niveau.
- **Choix libre du livret** : on peut entraîner n’importe quel livret à tout moment.
- **Exercices variés générés à l’infini** : 4 choix, je tape le résultat, nombre caché (7 × ? = 56), vrai ou faux, quadrillage de cubes.
- **Moteur pédagogique** : suivi de chaque calcul (les calculs ratés reviennent plus souvent), erreurs typiques repérées (résultat voisin, addition au lieu de multiplication, chiffres inversés), explication et nouvel essai après une erreur, astuces par livret, révisions espacées (1, 3, 7, 14, 30 jours).
- **Défi éclair** : 60 secondes de calculs enchaînés, séries, chat qui court vers son record. La vitesse ne compte jamais pour la maîtrise.
- **Missions d’aventure** : retrouver Pompon, réparer la tour, faire partir le train.
- **Construction** de l’île en voxels, avec objets débloqués par la progression.
- **Espace parents** protégé par code : temps de jeu, précision, livrets maîtrisés, calculs les plus difficiles, erreurs fréquentes, conseils, durée de séance, réinitialisation d’un livret sans effacer la ville.
- Effets visuels (étoiles, pièces, confettis), sons doux désactivables, aucune publicité, aucun achat, aucune pénalité en cas d’absence.

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
src/game/      catalogue d'objets, accessoires, îles, missions
src/profiles/  profils, sauvegarde, réglages parents
src/components/ chat, île isométrique, exercices, quadrillage, leçons, scènes, effets
src/screens/   accueil, création du chat, diagnostic, village, mission, défi éclair, carte, parents
```

Le moteur est indépendant de l’affichage : on pourra y ajouter d’autres matières (maths, lecture) plus tard.

## Prochaines étapes (phases 2 et 3)

Missions quotidiennes structurées, synchronisation cloud, Arène des défis entre sœurs, collection de chats, nouvelles îles et constructions, tableau de bord parent enrichi.
