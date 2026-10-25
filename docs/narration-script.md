# Script de narration — voix off ElevenLabs

Ce document est le **contrat** entre les fichiers audio et le code : chaque
ligne correspond à un fichier MP3 attendu dans `public/audio/`, et le moteur
de jeu jouera ce fichier au lieu de la synthèse vocale du navigateur.

## Voix recommandée

| Voix | `voice_id` | Verdict |
|---|---|---|
| **Paul K - Deep Engaging Storyteller** | `MBIQRZjHPU6xEjGuB3b8` | ✅ **à utiliser** — comédien français (Paris), timbre chaud et intime, pensé pour l'audiobook et le récit immersif |
| Paul K — French Ad & Trailer Voice | `ecxPjiGTvAfpGEams6ec` | ❌ à éviter ici — voix de pub/bande-annonce, punchy et vendeuse : contresens pour une veillée |

### Réglages ElevenLabs conseillés

- **Modèle** : `eleven_v3` ou `eleven_v4` (ils respectent les « … » comme des respirations).
- **Stability** : ~40 % — assez bas pour laisser de l'expressivité, assez haut pour rester cohérent d'une ligne à l'autre.
- **Similarity** : ~75 %.
- **Style exaggeration** : ~15 % (au-delà, la voix surjoue et casse le côté intime).
- **Speed** : 0,9 — le narrateur raconte, il ne presse pas.

## Règle importante : aucun nom propre dans l'audio

Les prénoms des joueurs sont saisis à chaque partie : ils ne peuvent donc pas
être enregistrés. Les phrases ci-dessous ont été **réécrites sans nom, sans
rôle et sans numéro de jour** — ces informations sont déjà affichées à l'écran
au moment exact où la phrase est prononcée (liste des morts, nom de l'éliminé,
victime montrée à la Sorcière…). Résultat : 100 % de la narration est
enregistrable avec une seule voix, sans jamais basculer sur la voix robotique
du téléphone en plein milieu d'une phrase.

## Le script (31 lignes)

| # | Fichier attendu | Texte à générer |
|---|---|---|
| 01 | `01-ouverture.mp3` | Bienvenue à Thiercelieux… Un village paisible, en apparence. Que le sort en soit jeté. |
| 02 | `02-distribution.mp3` | Chacun va découvrir son rôle, en secret. Passez le téléphone… et ne montrez rien à personne. |
| 03 | `03-nuit-premiere.mp3` | La nuit tombe sur le village… Le silence se fait. Que tout le monde ferme les yeux. |
| 04 | `04-nuit-suivante.mp3` | La nuit revient sur Thiercelieux… Fermez les yeux, et priez pour voir l'aube. |
| 05 | `05-voleur.mp3` | Le Voleur se réveille… et convoite les deux cartes qui n'ont trouvé personne. |
| 06 | `06-cupidon.mp3` | Cupidon se réveille… Sa flèche va lier deux cœurs, pour le meilleur et pour le pire. |
| 07 | `07-amoureux.mp3` | Les Amoureux se reconnaissent en secret… puis se rendorment, liés à jamais. |
| 08 | `08-salvateur.mp3` | Le Salvateur se réveille… Sur qui étendra-t-il sa protection cette nuit ? |
| 09 | `09-voyante.mp3` | La Voyante se réveille… Une seule âme lui livrera son secret. |
| 10 | `10-loups.mp3` | Les Loups-Garous se réveillent… Ils se reconnaissent, se comprennent, et choisissent leur proie. |
| 11 | `11-petite-fille.mp3` | La Petite Fille peut entrouvrir les yeux… mais gare à elle si un loup croise son regard. |
| 12 | `12-petite-fille-reperee.mp3` | Un loup a senti un regard dans l'ombre… La Petite Fille a été repérée ! |
| 13 | `13-sorciere.mp3` | La Sorcière se réveille… Elle découvre qui les crocs ont choisi cette nuit. |
| 14 | `14-sorciere-sans-victime.mp3` | La Sorcière se réveille… et contemple un village encore intact. |
| 15 | `15-flute.mp3` | Le Joueur de Flûte se réveille… Sa mélodie va envoûter deux nouvelles âmes. |
| 16 | `16-jour.mp3` | Le jour se lève sur le village… Chacun rouvre les yeux. |
| 17 | `17-aucun-mort.mp3` | Et pourtant… ce matin, personne ne manque à l'appel. Le village respire. |
| 18 | `18-un-mort.mp3` | Le village se réveille en deuil… L'un des siens ne verra pas ce jour se coucher. |
| 19 | `19-plusieurs-morts.mp3` | Le village se réveille en deuil… La nuit a emporté plusieurs des siens. |
| 20 | `20-vote.mp3` | L'heure du jugement a sonné. Que chacun désigne, en son âme et conscience, celui qu'il soupçonne. |
| 21 | `21-elimination.mp3` | Le village a tranché… Le sort de l'accusé est scellé. |
| 22 | `22-egalite.mp3` | Les voix se sont partagées… Un second tour départagera les accusés. |
| 23 | `23-egalite-sans-mort.mp3` | Le village n'a pas su choisir… Personne ne mourra aujourd'hui. |
| 24 | `24-bouc-emissaire.mp3` | Faute d'accord, la foule se retourne contre le Bouc Émissaire… qui paie pour tous. |
| 25 | `25-idiot.mp3` | C'était l'Idiot du Village ! On l'épargne en riant… mais on ne l'écoutera plus jamais voter. |
| 26 | `26-ancien.mp3` | Le village a tué l'Ancien de ses propres mains… Avec lui s'éteignent tous les pouvoirs des villageois. |
| 27 | `27-chasseur.mp3` | Le Chasseur s'effondre… Dans un dernier souffle, il arme son fusil. |
| 28 | `28-victoire-village.mp3` | Tous les Loups-Garous ont été éliminés : le Village remporte la partie ! |
| 29 | `29-victoire-loups.mp3` | Les Loups-Garous sont désormais aussi nombreux que le reste du village : ils remportent la partie ! |
| 30 | `30-victoire-amoureux.mp3` | Les Amoureux sont les deux derniers survivants : ils remportent la partie ensemble ! |
| 31 | `31-victoire-flute.mp3` | Le Joueur de Flûte a charmé tout le village : il remporte la partie seul ! |

## Livraison des fichiers

**Option A (idéale)** — un MP3 par ligne, nommé exactement comme la colonne
« Fichier attendu ». Rien à découper, je les pose dans `public/audio/`.

**Option B (plus rapide à générer)** — un seul MP3 contenant les 31 lignes
**dans l'ordre**, générées en une fois depuis le bloc ci-dessous, puis découpé
par `node scripts/split-narration.mjs <fichier.mp3>`.

> **Ne comptez pas sur les balises `<break>`.** Sur l'enregistrement
> effectivement utilisé, ElevenLabs les a ignorées : les 56 pauses du fichier
> mesuraient toutes entre 0,40 s et 0,68 s, sans rien qui distingue une fin de
> ligne d'un « … » interne, et deux passages de 10 s et 14 s n'en comportaient
> aucune. Un découpage par simple détection de silence est donc impossible.
>
> C'est pourquoi `split-narration.mjs` aligne les lignes sur l'enveloppe
> d'énergie du signal par programmation dynamique, en s'appuyant sur la durée
> attendue de chaque ligne, puis vérifie son résultat et refuse d'écrire s'il
> n'est pas sûr. Une pause nette entre les lignes reste utile — elle améliore
> la qualité de l'alignement — mais n'est plus indispensable.

### Bloc prêt à coller (option B)

```
Bienvenue à Thiercelieux… Un village paisible, en apparence. Que le sort en soit jeté. <break time="2.5s" />
Chacun va découvrir son rôle, en secret. Passez le téléphone… et ne montrez rien à personne. <break time="2.5s" />
La nuit tombe sur le village… Le silence se fait. Que tout le monde ferme les yeux. <break time="2.5s" />
La nuit revient sur Thiercelieux… Fermez les yeux, et priez pour voir l'aube. <break time="2.5s" />
Le Voleur se réveille… et convoite les deux cartes qui n'ont trouvé personne. <break time="2.5s" />
Cupidon se réveille… Sa flèche va lier deux cœurs, pour le meilleur et pour le pire. <break time="2.5s" />
Les Amoureux se reconnaissent en secret… puis se rendorment, liés à jamais. <break time="2.5s" />
Le Salvateur se réveille… Sur qui étendra-t-il sa protection cette nuit ? <break time="2.5s" />
La Voyante se réveille… Une seule âme lui livrera son secret. <break time="2.5s" />
Les Loups-Garous se réveillent… Ils se reconnaissent, se comprennent, et choisissent leur proie. <break time="2.5s" />
La Petite Fille peut entrouvrir les yeux… mais gare à elle si un loup croise son regard. <break time="2.5s" />
Un loup a senti un regard dans l'ombre… La Petite Fille a été repérée ! <break time="2.5s" />
La Sorcière se réveille… Elle découvre qui les crocs ont choisi cette nuit. <break time="2.5s" />
La Sorcière se réveille… et contemple un village encore intact. <break time="2.5s" />
Le Joueur de Flûte se réveille… Sa mélodie va envoûter deux nouvelles âmes. <break time="2.5s" />
Le jour se lève sur le village… Chacun rouvre les yeux. <break time="2.5s" />
Et pourtant… ce matin, personne ne manque à l'appel. Le village respire. <break time="2.5s" />
Le village se réveille en deuil… L'un des siens ne verra pas ce jour se coucher. <break time="2.5s" />
Le village se réveille en deuil… La nuit a emporté plusieurs des siens. <break time="2.5s" />
L'heure du jugement a sonné. Que chacun désigne, en son âme et conscience, celui qu'il soupçonne. <break time="2.5s" />
Le village a tranché… Le sort de l'accusé est scellé. <break time="2.5s" />
Les voix se sont partagées… Un second tour départagera les accusés. <break time="2.5s" />
Le village n'a pas su choisir… Personne ne mourra aujourd'hui. <break time="2.5s" />
Faute d'accord, la foule se retourne contre le Bouc Émissaire… qui paie pour tous. <break time="2.5s" />
C'était l'Idiot du Village ! On l'épargne en riant… mais on ne l'écoutera plus jamais voter. <break time="2.5s" />
Le village a tué l'Ancien de ses propres mains… Avec lui s'éteignent tous les pouvoirs des villageois. <break time="2.5s" />
Le Chasseur s'effondre… Dans un dernier souffle, il arme son fusil. <break time="2.5s" />
Tous les Loups-Garous ont été éliminés : le Village remporte la partie ! <break time="2.5s" />
Les Loups-Garous sont désormais aussi nombreux que le reste du village : ils remportent la partie ! <break time="2.5s" />
Les Amoureux sont les deux derniers survivants : ils remportent la partie ensemble ! <break time="2.5s" />
Le Joueur de Flûte a charmé tout le village : il remporte la partie seul !
```

## Intégration prévue (côté code)

Quand les fichiers seront livrés :

1. Les MP3 iront dans `public/audio/` (précachés par le service worker, donc
   la narration fonctionnera **hors connexion** comme le reste de l'app).
2. `useNarrator` gagnera une piste « audio enregistré » : chaque phrase du
   moteur sera associée à son fichier, avec repli automatique sur la synthèse
   vocale du navigateur si un fichier manque ou ne peut pas être lu.
3. Les textes de `src/game-engine/narrator.ts` seront alignés **mot pour mot**
   sur ce script, pour que le sous-titre affiché corresponde exactement à ce
   qui est entendu.
4. Les réglages vitesse/hauteur des paramètres ne s'appliqueront plus qu'au
   mode synthèse vocale (un fichier enregistré ne se re-module pas) ; le volume
   et les boutons Passer / Répéter / Couper continueront de fonctionner.
