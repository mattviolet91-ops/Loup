# Règles du jeu — Loup-Garou de Thiercelieux

Ce document décrit **précisément** les règles implémentées par le moteur de jeu
(`src/game-engine`). Il sert de référence unique entre les règles officielles du
jeu *Les Loups-Garous de Thiercelieux* (Philippe des Pallières & Hervé Marly,
éd. Lui-même Éditions / Asmodée) et le code. Quand une règle varie selon les
éditions/extensions, la variante retenue est indiquée explicitement, ainsi que
la raison du choix et la manière dont l'architecture permet de la changer.

> Sources consultées pour vérifier les règles de base et des rôles d'extension
> (Ancien, Salvateur, Bouc émissaire, Joueur de flûte) : règles officielles du
> jeu de base, règles de l'extension *La Nouvelle Lune*, et plusieurs
> synthèses de règles de référence en français (regledujeu.fr, lamaisondemila.fr,
> la synthèse "Loups-Garous XXL" de l'Université d'Angers, wiki loupgarou.fandom.com).
> Ce fichier consolide ces sources ; en cas de divergence entre éditions, la
> variante retenue est marquée **[Variante retenue]**.

## 1. Principe général

- Le village est composé de **Villageois** et de **Loups-Garous** cachés parmi eux,
  plus éventuellement des rôles spéciaux appartenant à l'une ou l'autre équipe
  (ou à une équipe indépendante : Amoureux, Joueur de Flûte).
- La partie alterne des phases de **Nuit** (les rôles agissent en secret,
  un par un) et de **Jour** (discussion puis vote pour éliminer un suspect).
- La partie s'arrête dès qu'une condition de victoire est remplie.

## 2. Équipes (`Team`)

| Équipe | Rôles qui en font partie par défaut |
|---|---|
| `VILLAGE` | Villageois, Voyante, Sorcière, Chasseur, Petite Fille, Voleur*, Salvateur, Ancien, Idiot du Village, Bouc Émissaire |
| `WEREWOLVES` | Loup-Garou |
| `INDEPENDENT` | Cupidon (rejoint son équipe d'origine après avoir formé le couple), Joueur de Flûte, Amoureux (équipe transversale, cf. §7) |

`*` Le Voleur peut échanger sa carte contre une carte Loup-Garou en début de
partie et changer d'équipe (cf. §6.3).

Le **Cupidon** est un Villageois avant tout : il garde sa condition de victoire
Village, sauf s'il devient lui-même un des deux Amoureux, auquel cas la
condition de victoire des Amoureux (§7) s'applique en plus.

## 3. Rôles implémentés

Chaque rôle est un objet `RoleDefinition` (voir `src/game-engine/roles`) avec :
nom, emoji, équipe, description, camp, ordre d'action de nuit (ou `null` si
aucune action de nuit), nombre d'utilisations, et la logique de résolution.

### Villageois 🧑‍🌾
Aucun pouvoir. Vote le jour. Gagne si le Village gagne.

### Loup-Garou 🐺
- Chaque nuit (sauf la toute première tant que Cupidon/Voleur agissent avant),
  les Loups-Garous se réveillent **ensemble**, se reconnaissent entre eux, puis
  désignent une victime.
- **Plusieurs loups → vote interne** : si plusieurs Loups-Garous sont vivants,
  chacun choisit sa cible préférée (à tour de rôle, téléphone passé entre eux
  après un écran "Loups-Garous, à vous : passez-vous le téléphone entre vous"),
  puis la cible ayant recueilli le plus de voix est attaquée. En cas d'égalité,
  la cible est tirée au sort parmi les cibles à égalité **[Variante retenue,
  cf. §6.1]** — dans la vraie vie les loups s'accordent à l'unanimité par gestes ;
  un mécanisme de vote explicite est nécessaire pour un jeu à un seul appareil.
- La victime est éliminée en fin de nuit sauf si la Sorcière la sauve ou si le
  Salvateur l'a protégée cette nuit-là.
- Victoire : les Loups-Garous gagnent dès qu'ils sont **au moins aussi
  nombreux** que le reste des joueurs vivants (cf. §9).

### Voyante 🔮
- Chaque nuit, consulte en secret **le rôle exact** d'un joueur de son choix
  (elle-même exclue en général, mais rien ne l'interdit officiellement).
- L'information n'est montrée qu'à elle (écran plein écran, masqué ensuite).

### Sorcière 🧪
- Possède deux potions **à usage unique chacune, pour toute la partie** :
  - **Potion de vie** : peut sauver la victime désignée par les Loups-Garous.
  - **Potion de mort** : peut tuer n'importe quel joueur vivant de son choix
    (y compris elle-même).
- Elle est informée de la victime des loups avant de décider.
- **Elle peut utiliser ses deux potions la même nuit** si elle le souhaite
  (règle officielle : chaque potion est limitée à une utilisation *sur toute la
  partie*, pas à une utilisation par nuit).
- Ne peut pas revenir sur une potion déjà utilisée lors d'une nuit précédente.

### Chasseur 🏹
- **Dès qu'il meurt**, peu importe la cause (vote, loups, potion de mort,
  Bouc Émissaire...), il désigne immédiatement un joueur encore vivant qui est
  éliminé à son tour, avant que la partie ne continue.
- Cette action peut elle-même déclencher d'autres effets en cascade
  (mort d'un Amoureux, mort d'un second Chasseur, vérification de victoire...).

### Cupidon 💘
- **Uniquement la première nuit**, désigne deux joueurs (lui compris,
  éventuellement) qui deviennent **Amoureux**.
- Les deux Amoureux découvrent immédiatement leur lien (et l'identité/rôle de
  l'autre) via un écran dédié, juste après le choix de Cupidon.
- Voir §7 pour les conséquences du lien amoureux.

### Petite Fille 👧
- Pendant que les Loups-Garous choisissent leur victime, la Petite Fille peut
  **espionner** en risquant de se faire repérer.
- **[Adaptation numérique]** La règle originale suppose que la Petite Fille
  entrouvre les yeux physiquement pendant que les autres joueurs ont les yeux
  fermés — ce geste ne peut pas être reproduit fidèlement sur un smartphone
  partagé. L'application propose donc, immédiatement après le choix des
  Loups-Garous : un écran "Veux-tu espionner les Loups-Garous ?". Si elle
  espionne, elle voit qui sont les Loups-Garous, mais court un risque
  configurable (20 % par défaut, `spySpotChance` dans `GameConfig`) d'être
  repérée : si elle est repérée, **elle devient la victime des Loups-Garous à
  la place de la cible initialement choisie**, conformément à l'esprit de la
  règle officielle ("si elle se fait surprendre, elle meurt à la place de la
  victime désignée").

### Voleur 🃏
- Uniquement possible si **2 cartes de rôle supplémentaires** sont ajoutées à
  la pioche (donc `nombre de cartes = nombre de joueurs + 2`, dont 2 non
  distribuées).
- **Avant toute autre action**, la première nuit, le Voleur regarde les deux
  cartes restantes et peut échanger sa carte contre l'une d'elles.
- **Règle officielle** : si les deux cartes restantes sont toutes les deux des
  Loups-Garous, l'échange est **obligatoire**. Sinon il est optionnel.
- S'il échange, il prend immédiatement le rôle (et l'équipe) de la nouvelle
  carte pour le reste de la partie.

### Salvateur 🛡️ *(rôle d'extension, "La Nouvelle Lune")*
- Chaque nuit, protège un joueur de son choix contre l'attaque des Loups-Garous.
- La protection **ne fonctionne pas** contre la Sorcière, le vote ou le
  Chasseur — uniquement contre l'attaque des loups.
- **Ne peut pas protéger la même personne deux nuits de suite** (règle
  officielle de la carte).

### Ancien 👴 *(rôle d'extension, "La Nouvelle Lune")*
- Bénéficie d'une **vie supplémentaire face aux Loups-Garous uniquement** :
  la première fois que les loups l'attaquent (et qu'il n'est pas sauvé par la
  Sorcière/Salvateur), il survit sans que personne ne le sache, y compris lui.
  La seconde attaque des loups est fatale.
- Cette vie supplémentaire ne protège **ni** contre la potion de mort de la
  Sorcière, **ni** contre un vote du village, **ni** contre le Chasseur.
- **Règle spéciale de vote** : si le Village élimine l'Ancien **par le vote**,
  tous les villageois (équipe `VILLAGE`, Loups-Garous exclus) **perdent
  définitivement leurs pouvoirs spéciaux** pour le reste de la partie (ils
  jouent comme de simples Villageois). C'est la sanction officielle pour avoir
  éliminé le protecteur du village par erreur.

### Idiot du Village 🤪 *(rôle d'extension, "La Nouvelle Lune")*
- S'il est **désigné par le vote du village**, il est démasqué mais **ne meurt
  pas** : il reste en vie, révèle sa carte, mais **perd définitivement le
  droit de voter** pour le reste de la partie.
- Ce sursis ne s'applique **qu'au vote** : les Loups-Garous, la Sorcière ou le
  Chasseur peuvent le tuer normalement.

### Bouc Émissaire 🐐 *(rôle d'extension, "La Nouvelle Lune")*
- Aucune action de nuit.
- **En cas d'égalité de voix** lors d'un vote, c'est le Bouc Émissaire qui est
  éliminé automatiquement **à la place** d'un nouveau tour de vote ou d'un tirage
  au sort.
- **En mourant ainsi**, il désigne un ou plusieurs joueurs qui seront **les
  seuls autorisés à voter** lors du prochain vote du village (il peut aussi ne
  désigner personne, auquel cas tout le monde revote normalement).
- S'il meurt d'une autre manière (loups, sorcière, chasseur), il n'a aucun
  pouvoir particulier : simple Villageois.

### Joueur de Flûte 🪈 *(rôle d'extension, souvent appelée "Joueur de Flûte" ou "Flûtiste")*
- Chaque nuit, charme **deux joueurs** de son choix (les charmes s'accumulent
  nuit après nuit ; un joueur déjà charmé peut être re-choisi sans effet).
- Les joueurs charmés savent qu'ils sont charmés (et découvrent l'identité des
  autres charmés au fil du jeu), mais gardent leur rôle et leurs pouvoirs
  normaux, et continuent à voter/agir normalement pour leur camp d'origine —
  seule leur **condition de victoire change** (§9).
- Le Joueur de Flûte ne peut pas se charmer lui-même et n'a besoin d'aucune
  protection : il n'est jamais la cible des Loups-Garous par une règle
  spéciale (il peut mourir normalement par vote, sorcière, chasseur...). S'il
  meurt, tous les joueurs charmés sont immédiatement libérés et retrouvent
  leur camp d'origine pour la suite de la partie.
- Victoire : le Joueur de Flûte gagne **seul** dès que tous les joueurs
  vivants restants (à l'exception de lui-même) sont charmés.

## 4. Rôles "cachés" derrière un autre rôle

Le moteur ne code pas de rôle générique "carte non utilisée" : seuls les rôles
sélectionnés dans la configuration de partie sont distribués. Le Voleur peut
faire apparaître temporairement jusqu'à 2 rôles non distribués à personne
(cf. §6.3) ; ces 2 cartes ne sont jamais assignées à un joueur si le Voleur ne
les prend pas.

## 5. Ordre exact des actions de nuit

L'ordre retenu par défaut par `NightOrder` (adaptable en configuration) est le
suivant. Un rôle absent de la partie, ou déjà résolu, ou dont l'action ne
s'applique qu'à la première nuit, est **automatiquement sauté** par le moteur —
il n'y a jamais d'écran "vide" affiché aux joueurs.

1. **Voleur** (1ère nuit uniquement) — échange éventuelle de carte.
2. **Cupidon** (1ère nuit uniquement) — désigne les deux Amoureux.
3. **Amoureux** (1ère nuit uniquement) — découverte mutuelle, écran informatif.
4. **Salvateur** (chaque nuit) — protège un joueur.
5. **Voyante** (chaque nuit) — consulte un rôle.
6. **Loups-Garous** (chaque nuit) — choisissent une victime.
7. **Petite Fille** (chaque nuit, si vivante) — espionnage optionnel à risque.
8. **Sorcière** (chaque nuit) — potion de vie / potion de mort.
9. **Joueur de Flûte** (chaque nuit) — charme deux joueurs.
10. **Résolution de la nuit** — calcul des morts, cascade Amoureux/Chasseur,
    vérification des conditions de victoire.

> Cet ordre suit celui communément documenté pour le jeu de base
> (Voleur → Cupidon → Voyante → Loups-Garous → Sorcière), en insérant les rôles
> d'extension aux emplacements les plus couramment recommandés (Salvateur
> juste avant l'attaque, Petite Fille juste après pour "espionner" l'attaque en
> cours, Joueur de Flûte en dernier car son effet ne dépend d'aucun autre).
> Certaines éditions placent le Salvateur ou le Joueur de Flûte différemment :
> l'ordre est un tableau de priorités dans `src/game-engine/nightOrder.ts`,
> modifiable sans toucher au reste du moteur.

## 6. Votes et élimination

### 6.1 Vote de nuit des Loups-Garous
Décrit en §3 (Loup-Garou). Vote majoritaire interne entre loups vivants,
égalité tranchée aléatoirement.

### 6.2 Vote de jour
- Chaque joueur vivant **ayant le droit de vote** (cf. Idiot du Village) vote,
  à tour de rôle, en secret (téléphone passé), pour désigner un suspect.
- Un joueur peut **s'abstenir**.
- Le joueur ayant reçu le plus de voix est éliminé.
- **Égalité** :
  - S'il y a un **Bouc Émissaire vivant**, il est éliminé à la place d'un
    nouveau tour (cf. §3, Bouc Émissaire).
  - Sinon, un **second tour de vote** a lieu uniquement entre les joueurs
    arrivés à égalité (les autres joueurs votent à nouveau parmi ces
    candidats). Si l'égalité persiste, **personne n'est éliminé** ce jour-là
    **[Variante retenue]** — règle usuelle par défaut la plus sûre pour rester
    fidèle à l'esprit "pas d'élimination arbitraire", et clairement isolée
    dans `VoteSystem.resolveTie()` pour être remplacée par un tirage au sort si
    une table préfère cette variante.
- Le joueur éliminé par vote révèle son rôle (paramétrable, activé par défaut).

### 6.3 Voleur et cartes supplémentaires
Voir §3. Géré par `GameConfig` : quand le rôle Voleur est sélectionné, le
moteur ajoute automatiquement 2 rôles supplémentaires (choisis parmi les rôles
déjà sélectionnés pour la partie, dans des proportions cohérentes) qui ne sont
jamais assignés à un joueur, sauf échange par le Voleur.

## 7. Amoureux

- Formés par Cupidon (§3), quels que soient leurs rôles/équipes d'origine.
- **Si l'un des deux Amoureux meurt** (quelle qu'en soit la cause), **l'autre
  meurt immédiatement de chagrin**, avant toute autre résolution
  (y compris s'il s'agit de la cible d'un Chasseur qui vient de mourir : la
  cascade est traitée à chaque mort jusqu'à stabilisation).
- **Condition de victoire indépendante** : si les deux Amoureux sont, à un
  moment donné, les **deux seuls joueurs encore en vie**, ils gagnent **tous
  les deux ensemble**, indépendamment de leurs équipes d'origine (même si l'un
  est Loup-Garou et l'autre Villageois). Cette condition est vérifiée en
  priorité sur toutes les autres (§9).

## 8. Journée

1. **Annonce du jour** : la ou les victimes de la nuit sont révélées (nom, et
   rôle si l'option "révéler les rôles à la mort" est active).
2. **Discussion libre**, sans minuteur imposé bloquant, avec un minuteur
   informatif optionnel réglable dans les paramètres et un bouton
   "Terminer les discussions" pour passer manuellement au vote.
3. **Vote** (cf. §6.2).
4. **Résolution** : élimination, effets en cascade (Chasseur, Amoureux, Ancien,
   Idiot du Village, Bouc Émissaire).
5. **Vérification des conditions de victoire** (§9). Si aucune n'est remplie,
   retour à la Nuit.

## 9. Conditions de victoire

Vérifiées après **chaque** résolution (nuit, vote, tir du Chasseur), dans cet
ordre de priorité :

1. **Amoureux** : s'il ne reste en vie que les deux Amoureux → victoire des
   Amoureux (fin de partie immédiate).
2. **Joueur de Flûte** : si tous les joueurs vivants sauf lui sont charmés →
   victoire du Joueur de Flûte (fin de partie immédiate).
3. **Village** : si tous les Loups-Garous sont morts → victoire du Village.
4. **Loups-Garous** : si le nombre de Loups-Garous vivants est **supérieur ou
   égal** au nombre d'autres joueurs vivants → victoire des Loups-Garous
   (les loups ne peuvent alors plus être mis en minorité au vote).
5. Sinon, la partie continue.

## 10. Configuration de partie et validations

`GameConfig` + `validateGameConfig()` interdisent toute configuration :

- où le nombre de rôles ≠ nombre de joueurs (sauf +2 non distribués si Voleur
  en jeu) ;
- avec 0 Loup-Garou, ou un nombre de Loups-Garous ne laissant pas le Village
  majoritaire (`loups < joueurs / 2`) ;
- avec un rôle unique sélectionné plus d'une fois (Voyante, Sorcière, Cupidon,
  Chasseur, Petite Fille, Voleur, Salvateur, Ancien, Idiot du Village, Bouc
  Émissaire, Joueur de Flûte : chacun 0 ou 1 exemplaire) ;
- avec un nombre de joueurs hors bornes (`MIN_PLAYERS = 5`, `MAX_PLAYERS = 24`
  par défaut, configurable) ;
- avec un rôle nécessitant plus de joueurs qu'il n'y en a réellement (ex :
  Cupidon nécessite ≥ 3 joueurs pour avoir un sens, Voleur nécessite que la
  pioche totale (joueurs + 2) reste réalisable) ;
- avec des prénoms de joueurs vides ou dupliqués.

Chaque erreur produit un message explicite ; l'écran de configuration affiche
soit "Configuration valide ✅" soit la liste des erreurs sous
"Configuration impossible ❌".

## 11. Confidentialité

- Aucun rôle n'apparaît jamais dans l'URL, le `localStorage` n'est utilisé que
  côté client (aucune donnée envoyée à un serveur : application 100 % locale).
- L'écran de révélation de rôle est un composant plein écran dédié, qui
  s'auto-masque après confirmation du joueur et ne conserve aucune trace
  visible à l'écran ensuite.
- Aucun `console.log` n'imprime de rôle ou d'information secrète.
