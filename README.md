# ChronoCats

**Construis ton monde, maîtrise le temps !**

Jeu éducatif pour apprendre à lire l’heure sur une horloge à aiguilles, pensé pour Anaëlle et Alice (11 ans). Principalement pour iPad, fonctionne aussi sur smartphone et ordinateur. Installable sur l’écran d’accueil (PWA).

## Ce que contient la phase 1

- **Deux profils séparés** (Anaëlle, Alice) : chat, ville, pièces, cubes, étoiles, progression et statistiques propres à chacune.
- **Chat compagnon** : nom, 6 pelages (le fantastique se débloque), accessoires débloqués par la maîtrise des chapitres, animations et réactions.
- **Horloge interactive exacte** : on tire les aiguilles au doigt ; la petite aiguille avance de 0,5° par minute (à 8 h 45 elle est presque sur le 9).
- **Diagnostic « Le Grand Réveil »** (environ 5 minutes) qui place chaque enfant au bon chapitre.
- **Moteur pédagogique** : 12 chapitres, exercices générés à l’infini (lire, régler, choisir la bonne horloge, corriger une horloge fausse, expressions « et quart », « moins le quart »…), détection des erreurs typiques, explications après chaque erreur, nouvel essai, indices, remédiation ciblée si les aiguilles sont confondues, révisions espacées (1, 3, 7, 14, 30 jours, ajustées selon la réussite).
- **3 missions d’aventure** : retrouver Pompon le chaton, réparer la tour, faire partir le train.
- **Construction** : île isométrique en voxels, objets à poser, déplacer et ranger, déblocages liés à la progression, sauvegarde automatique.
- **Carte de l’archipel** : 6 îles, 12 chapitres, rejouer n’importe quel chapitre ouvert.
- **Espace parents** protégé par code : temps de jeu, précision, compétences, erreurs fréquentes, recommandations, durée de séance conseillée, réinitialiser un chapitre sans effacer la ville.
- Sons doux désactivables, pas de publicité, pas d’achats, aucune pénalité en cas d’absence.

Le jeu des livrets (tables de multiplication) reste disponible sur `/livret/`.

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests de l'horloge et du moteur pédagogique
npm run build    # version de production dans dist/
```

## Mise en ligne (Netlify)

Le fichier `netlify.toml` est prêt : commande `npm run build`, dossier publié `dist`. Relier le dépôt GitHub dans Netlify suffit ; chaque push sur `main` redéploie.

## Sauvegardes

Phase 1 : sauvegarde locale sur l’appareil (une clé par enfant, jamais mélangées). Le format est prêt pour une synchronisation cloud (Supabase, avec compte parent et profils enfants internes) en phase 2.

## Organisation du code

```
src/engine/    moteur pédagogique : horloge, chapitres, exercices, maîtrise, révisions, diagnostic (+ tests)
src/game/      catalogue d'objets, accessoires, îles, missions
src/profiles/  profils, sauvegarde, réglages parents
src/components/ horloge, chat, île isométrique, exercices, leçons, scènes
src/screens/   accueil, création du chat, diagnostic, village, mission, carte, parents
```

Le moteur est indépendant de l’affichage : on pourra y ajouter d’autres matières (maths, lecture) plus tard.

## Prochaines étapes (phases 2 et 3)

Missions quotidiennes structurées, synchronisation cloud, Arène des défis entre sœurs, collection de chats, nouvelles îles et constructions, tableau de bord parent enrichi.
