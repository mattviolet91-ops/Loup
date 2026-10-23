// Textes du narrateur et identifiants des clips audio correspondants.
//
// Ce module ne fait AUCUN appel à une API de synthèse vocale ni à l'audio du
// navigateur : il ne fournit que des données. La lecture est branchée côté UI
// par `useNarrator`, afin que le moteur de jeu reste testable et indépendant
// du navigateur.
//
// Chaque phrase porte un `clip` : le nom (sans extension) du fichier de
// `public/audio/`, enregistré avec la voix Paul K. Si le fichier est
// introuvable ou illisible, `useNarrator` retombe automatiquement sur la
// synthèse vocale de l'appareil en lisant `text`.
//
// Règle à respecter en modifiant ce fichier : **aucun nom de joueur, de rôle
// ni de numéro de jour dans `text`**. Ces informations changent à chaque
// partie, donc elles ne peuvent pas être enregistrées ; elles sont déjà
// affichées à l'écran au moment où la phrase est prononcée. Voir
// `docs/narration-script.md`.
import { getRole } from './roles';
import type { NarrationPhrase, RoleId, VictoryResult } from './types';

function phrase(clip: string, text: string): NarrationPhrase {
  return { clip, text };
}

const VICTORY_CLIPS: Record<VictoryResult['winner'], string> = {
  VILLAGE: '28-victoire-village',
  WEREWOLVES: '29-victoire-loups',
  LOVERS: '30-victoire-amoureux',
  JOUEUR_DE_FLUTE: '31-victoire-flute',
};

export const NARRATION = {
  gameStart: () =>
    phrase('01-ouverture', "Bienvenue à Thiercelieux… Un village paisible, en apparence. Que le sort en soit jeté."),
  roleRevealStart: () =>
    phrase('02-distribution', "Chacun va découvrir son rôle, en secret. Passez le téléphone… et ne montrez rien à personne."),
  nightFalls: (n: number) =>
    n === 1
      ? phrase('03-nuit-premiere', "La nuit tombe sur le village… Le silence se fait. Que tout le monde ferme les yeux.")
      : phrase('04-nuit-suivante', "La nuit revient sur Thiercelieux… Fermez les yeux, et priez pour voir l'aube."),
  thiefTurn: () =>
    phrase('05-voleur', "Le Voleur se réveille… et convoite les deux cartes qui n'ont trouvé personne."),
  cupidTurn: () =>
    phrase('06-cupidon', "Cupidon se réveille… Sa flèche va lier deux cœurs, pour le meilleur et pour le pire."),
  loversWake: () =>
    phrase('07-amoureux', "Les Amoureux se reconnaissent en secret… puis se rendorment, liés à jamais."),
  salvateurTurn: () =>
    phrase('08-salvateur', "Le Salvateur se réveille… Sur qui étendra-t-il sa protection cette nuit ?"),
  voyanteTurn: () => phrase('09-voyante', "La Voyante se réveille… Une seule âme lui livrera son secret."),
  wolvesTurn: () =>
    phrase('10-loups', "Les Loups-Garous se réveillent… Ils se reconnaissent, se comprennent, et choisissent leur proie."),
  petiteFilleTurn: () =>
    phrase('11-petite-fille', "La Petite Fille peut entrouvrir les yeux… mais gare à elle si un loup croise son regard."),
  petiteFilleSpotted: () =>
    phrase('12-petite-fille-reperee', "Un loup a senti un regard dans l'ombre… La Petite Fille a été repérée !"),
  // Le nom de la victime est affiché sur l'écran de la Sorcière.
  sorciereTurn: (hasVictim: boolean) =>
    hasVictim
      ? phrase('13-sorciere', "La Sorcière se réveille… Elle découvre qui les crocs ont choisi cette nuit.")
      : phrase('14-sorciere-sans-victime', "La Sorcière se réveille… et contemple un village encore intact."),
  fluteTurn: () =>
    phrase('15-flute', "Le Joueur de Flûte se réveille… Sa mélodie va envoûter deux nouvelles âmes."),
  dayBreaks: () => phrase('16-jour', "Le jour se lève sur le village… Chacun rouvre les yeux."),
  noOneDied: () => phrase('17-aucun-mort', "Et pourtant… ce matin, personne ne manque à l'appel. Le village respire."),
  // Les noms des victimes sont affichés sur l'écran d'annonce du jour.
  someoneDied: (count: number) =>
    count <= 1
      ? phrase('18-un-mort', "Le village se réveille en deuil… L'un des siens ne verra pas ce jour se coucher.")
      : phrase('19-plusieurs-morts', "Le village se réveille en deuil… La nuit a emporté plusieurs des siens."),
  voteStart: () =>
    phrase('20-vote', "L'heure du jugement a sonné. Que chacun désigne, en son âme et conscience, celui qu'il soupçonne."),
  // Le nom et le rôle de l'éliminé sont affichés sur l'écran de résultat.
  voteResultElimination: () => phrase('21-elimination', "Le village a tranché… Le sort de l'accusé est scellé."),
  voteTie: () => phrase('22-egalite', "Les voix se sont partagées… Un second tour départagera les accusés."),
  voteTieNoResult: () =>
    phrase('23-egalite-sans-mort', "Le village n'a pas su choisir… Personne ne mourra aujourd'hui."),
  scapegoatEliminated: () =>
    phrase('24-bouc-emissaire', "Faute d'accord, la foule se retourne contre le Bouc Émissaire… qui paie pour tous."),
  idiotSpared: () =>
    phrase('25-idiot', "C'était l'Idiot du Village ! On l'épargne en riant… mais on ne l'écoutera plus jamais voter."),
  ancienVotedOut: () =>
    phrase(
      '26-ancien',
      "Le village a tué l'Ancien de ses propres mains… Avec lui s'éteignent tous les pouvoirs des villageois.",
    ),
  hunterDies: () => phrase('27-chasseur', "Le Chasseur s'effondre… Dans un dernier souffle, il arme son fusil."),
  victory: (victory: VictoryResult) => phrase(VICTORY_CLIPS[victory.winner], victory.message),
} as const;

export function roleName(roleId: RoleId): string {
  return getRole(roleId).name;
}
