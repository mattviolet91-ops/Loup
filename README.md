# 🐺 Loup-Garou de Thiercelieux — application web

Une application web complète pour jouer aux **Loups-Garous de Thiercelieux**
entre amis, **sur un seul téléphone**, sans maître du jeu humain : distribution
secrète des rôles, narrateur vocal automatique, gestion complète des phases de
nuit et de jour, votes, éliminations et conditions de victoire — le tout
100 % local, sans compte ni serveur.

## ✨ Fonctionnalités

- **Maître du jeu automatique** : l'application guide toute la partie (nuit,
  réveils dans l'ordre, jour, discussion, vote, résolution, victoire).
- **Narrateur vocal** (Web Speech API) : phrases d'ambiance à chaque étape,
  écrites dans un registre de conteur de veillée. La voix française la plus
  grave et la plus naturelle de l'appareil est sélectionnée automatiquement,
  avec un débit ralenti et une hauteur abaissée par défaut. Volume, vitesse,
  hauteur (grave ↔ aiguë) et voix sont réglables, avec un bouton d'écoute dans
  les paramètres. En jeu : **Passer** la narration en cours, la répéter, ou
  couper le son.
- **13 rôles jouables**, chacun avec une vraie mécanique de jeu (pas de simple
  carte décorative) : Villageois, Loup-Garou, Voyante, Sorcière, Chasseur,
  Cupidon, Petite Fille, Voleur, Salvateur, Ancien, Idiot du Village, Bouc
  Émissaire, Joueur de Flûte. Détails et sources dans [`RULES.md`](./RULES.md).
- **Configuration de partie robuste** : de 5 à 24 joueurs, sélection des rôles
  avec validation en temps réel (empêche toute configuration incohérente :
  nombre de rôles ≠ joueurs, trop de Loups-Garous, rôle en double, rôle
  nécessitant plus de joueurs, etc.).
- **Révélation secrète des rôles** en mode "passe-le-téléphone" : chaque
  joueur consulte uniquement son propre rôle, plein écran, masqué
  automatiquement ensuite.
- **Vote secret** joueur par joueur, avec gestion des égalités, du Bouc
  Émissaire et de l'Idiot du Village.
- **Sauvegarde locale automatique** : une partie interrompue (page actualisée,
  téléphone verrouillé…) peut être reprise exactement là où elle s'est
  arrêtée. Aucune donnée ne quitte l'appareil.
- **Résumé de fin de partie** (rôles et statuts de tous les joueurs) — jamais
  affiché avant la fin.
- **PWA installable**, thème sombre et immersif, mobile-first, grandes zones
  tactiles, animations discrètes, accessible (labels ARIA, contraste élevé en
  option, navigation clavier).

## 🚀 Installation et lancement

Prérequis : [Node.js](https://nodejs.org/) 20+.

```bash
npm install
npm run dev
```

Ouvrez l'URL affichée (par défaut `http://localhost:5173`) sur le téléphone ou
l'ordinateur qui servira de plateau de jeu.

Autres commandes utiles :

```bash
npm run build      # build de production dans dist/
npm run preview    # sert le build de production localement
npm test           # lance la suite de tests (vitest)
npm run typecheck  # vérifie les types TypeScript
npm run lint       # lint ESLint
```

## 🏗️ Architecture

Le projet sépare strictement le **moteur de jeu** (logique pure, testable,
sans dépendance UI) et l'**interface** (React) :

```
src/
  game-engine/         # Moteur de jeu, indépendant de React
    types.ts           # Types du domaine (Player, GameState, actions...)
    roles/             # Définition des 13 rôles (pouvoirs, camp, ordre...)
    config.ts           # Validation de configuration, répartitions par défaut
    engine.ts           # Machine à états (reducer) : SETUP → NIGHT → DAY → VOTE → ...
    nightOrder.ts        # Calcul dynamique de l'ordre des réveils de nuit
    actionSystem.ts       # Application des actions de nuit (un module par mécanique)
    deathSystem.ts        # Élimination d'un joueur + règles en cascade
    voteSystem.ts          # Vote de jour, égalités, Bouc Émissaire
    victorySystem.ts        # Conditions de victoire
    narrator.ts               # Textes de narration (aucune dépendance TTS ici)
    persistence.ts             # Sauvegarde/reprise locale (localStorage)
    __tests__/                 # Tests unitaires (vitest)
  hooks/
    useGame.ts          # Branche le moteur à React + narration + sauvegarde
    useNarrator.ts       # Wrapper Web Speech API (remplaçable par un autre moteur vocal)
    usePassDevice.ts      # Écran "passe le téléphone" réutilisable
  components/            # Écrans (accueil, configuration, nuit, jour, vote, victoire...)
```

Le moteur fonctionne comme une **machine à états** :

```
SETUP → ROLE_REVEAL → NIGHT → DAY_ANNOUNCEMENT → DISCUSSION → VOTE
  → VOTE_RESULT → (HUNTER_RESOLUTION | SCAPEGOAT_CHOICE)? → NIGHT → … → GAME_OVER
```

Chaque transition passe par `gameReducer(state, action)`, une fonction pure —
ce qui permet de tester exhaustivement la logique de jeu sans navigateur ni
DOM (voir la section Tests).

## 📜 Règles du jeu

Les règles précisément implémentées (rôles, ordre de nuit, votes, victoires,
variantes retenues et adaptations nécessaires pour un usage sur un seul
téléphone) sont documentées dans **[`RULES.md`](./RULES.md)**, avec les
sources utilisées pour les vérifier. Elles sont aussi consultables dans
l'application via "📜 Règles".

## 🧪 Tests

```bash
npm test
```

La suite (vitest) couvre notamment :

- la distribution des rôles (reproductible avec une graine, cohérente avec la
  configuration, gestion des 2 cartes supplémentaires du Voleur) ;
- la validation de configuration (rejet des configurations impossibles) ;
- le vote de jour (majorité, égalité → second tour, égalité persistante,
  Bouc Émissaire) ;
- les conditions de victoire (Village, Loups-Garous, Amoureux, Joueur de
  Flûte) ;
- chaque rôle spécial : Voyante, Sorcière (potions à usage unique, utilisables
  la même nuit), Cupidon et la cascade des Amoureux, Chasseur, Ancien (vie
  supplémentaire face aux loups, perte des pouvoirs du village si voté),
  Idiot du Village (immunité au vote puis perte du droit de vote), Salvateur,
  Voleur (échange obligatoire si nécessaire), Petite Fille, Joueur de Flûte,
  plusieurs Loups-Garous simultanés.

L'application a également été testée de bout en bout dans un navigateur réel
(Chromium/Playwright), en pilotant une partie complète — révélation des 13
rôles, nuit, jour, vote, victoire — sans aucune erreur console.

## 📱 PWA et fonctionnement hors ligne

L'application est une **Progressive Web App** : manifest, icônes et service
worker (généré par `vite-plugin-pwa`, précaching de tous les assets). Une fois
chargée une première fois, elle reste jouable **hors connexion** et peut être
**installée** sur l'écran d'accueil d'un smartphone (Android/iOS) comme une
application native.

## ♿ Accessibilité

- Contrastes vérifiés, option "Contraste élevé" dans les Paramètres.
- Larges zones tactiles (56px minimum) pensées pour un usage mobile à
  plusieurs mains qui se relaient.
- Labels ARIA sur les contrôles interactifs, rôles `switch`/`group` où
  pertinent.
- Navigation clavier possible sur l'ensemble des écrans (éléments focusables
  natifs : boutons, champs, `select`).
- Option pour désactiver les animations.

## 🔒 Confidentialité

- Application 100 % locale : aucune donnée de partie n'est envoyée à un
  serveur, tout reste dans le `localStorage` de l'appareil.
- Aucun rôle n'apparaît jamais dans l'URL, les paramètres visibles ou les
  logs.
- Écran de révélation plein écran, masqué automatiquement après confirmation.

## 🚢 Déploiement

Le projet est prêt pour un déploiement statique gratuit :

- **GitHub Pages** (configuration par défaut) : le workflow
  `.github/workflows/deploy-pages.yml` construit (`npm ci` puis
  `npm run build`) et publie le dossier `dist` à chaque push sur `main`, ainsi
  qu'à la demande (`workflow_dispatch`). Il utilise `actions/configure-pages`
  (avec `enablement: true`, qui active Pages automatiquement),
  `actions/upload-pages-artifact` et `actions/deploy-pages`, avec les
  permissions `pages: write` et `id-token: write`.
  L'application est alors accessible sur
  **<https://mattviolet91-ops.github.io/Loup/>**.
- **Netlify** : `netlify.toml` fourni (`npm run build`, dossier `dist`) — il
  suffit de connecter le dépôt sur [netlify.com](https://netlify.com).
- **Vercel** : aucune configuration nécessaire, Vercel détecte
  automatiquement un projet Vite (`npm run build`, dossier `dist`).

### Chemin public (`base`)

GitHub Pages sert le site depuis un sous-chemin (`/Loup/`) : l'option `base`
de Vite vaut donc `/Loup/` pour les builds de production, et `/` en
développement. Pour un hébergeur qui sert l'application à la racine du domaine
(Netlify, Vercel, domaine personnalisé), surchargez-la avec la variable
d'environnement `VITE_BASE` :

```bash
VITE_BASE=/ npm run build
```

(C'est déjà configuré dans `netlify.toml`.) Si vous renommez le dépôt,
adaptez la constante `GITHUB_PAGES_BASE` dans `vite.config.ts`.

## 🛠️ Technologies utilisées

- **React 18 + TypeScript** (Vite) — interface.
- **Moteur de jeu maison** en TypeScript pur, sans dépendance UI.
- **Web Speech API** (`SpeechSynthesis`) — narrateur vocal, architecture
  découplée pour pouvoir brancher un autre moteur vocal plus tard.
- **Vitest** + Testing Library — tests automatisés.
- **vite-plugin-pwa** — manifest, service worker, installation.
- **CSS natif** (variables CSS, pas de framework) — thème sombre immersif,
  animations légères, mobile-first.

## ⚠️ Portée de cette première version

Conçue pour un **seul téléphone partagé** entre tous les joueurs (voir
`RULES.md` pour le détail des adaptations numériques nécessaires, notamment
pour la Petite Fille). L'architecture (moteur de jeu séparé de l'UI, actions
sérialisables) est pensée pour permettre, dans une version future, un vrai
mode multijoueur en réseau sans réécrire la logique de jeu.
