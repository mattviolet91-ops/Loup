// Textes du narrateur. Ce module ne fait AUCUN appel à une API de synthèse
// vocale : il ne fournit que des chaînes de caractères. La lecture à voix
// haute est branchée côté UI par `useNarrator` (Web Speech API), afin que le
// moteur de jeu reste testable et indépendant du navigateur.
//
// Style : registre de conteur de veillée. Les points de suspension et les
// virgules sont volontaires — les moteurs de synthèse vocale les traduisent
// en respirations, ce qui rend la narration nettement plus immersive que des
// phrases plates.
import { getRole } from './roles';
import type { RoleId } from './types';

export const NARRATION = {
  gameStart: () =>
    "Bienvenue à Thiercelieux… Un village paisible, en apparence. Que le sort en soit jeté.",
  nightFalls: (n: number) =>
    n === 1
      ? "La nuit tombe sur le village… Le silence se fait. Que tout le monde ferme les yeux."
      : "La nuit revient sur Thiercelieux… Fermez les yeux, et priez pour voir l'aube.",
  thiefTurn: () => "Le Voleur se réveille… et convoite les deux cartes qui n'ont trouvé personne.",
  cupidTurn: () => "Cupidon se réveille… Sa flèche va lier deux cœurs, pour le meilleur et pour le pire.",
  loversWake: () => "Les Amoureux se reconnaissent en secret… puis se rendorment, liés à jamais.",
  salvateurTurn: () => "Le Salvateur se réveille… Sur qui étendra-t-il sa protection cette nuit ?",
  voyanteTurn: () => "La Voyante se réveille… Une seule âme lui livrera son secret.",
  wolvesTurn: () =>
    "Les Loups-Garous se réveillent… Ils se reconnaissent, se comprennent, et choisissent leur proie.",
  petiteFilleTurn: () =>
    "La Petite Fille peut entrouvrir les yeux… mais gare à elle si un loup croise son regard.",
  petiteFilleSpotted: () => "Un loup a senti un regard dans l'ombre… La Petite Fille a été repérée !",
  sorciereTurn: (victimName: string | null) =>
    victimName
      ? `La Sorcière se réveille… Cette nuit, les crocs se sont refermés sur ${victimName}.`
      : "La Sorcière se réveille… et contemple un village encore intact.",
  fluteTurn: () => "Le Joueur de Flûte se réveille… Sa mélodie va envoûter deux nouvelles âmes.",
  dayBreaks: (n: number) => `Le jour se lève sur le village… pour la ${ordinal(n)} fois.`,
  noOneDied: () => "Et pourtant… ce matin, personne ne manque à l'appel. Le village respire.",
  someoneDied: (names: string[]) =>
    names.length === 1
      ? `Le village se réveille en deuil… ${names[0]} ne verra pas ce jour se coucher.`
      : `Le village se réveille en deuil… ${names.join(' et ')} ont été emportés cette nuit.`,
  voteStart: () =>
    "L'heure du jugement a sonné. Que chacun désigne, en son âme et conscience, celui qu'il soupçonne.",
  voteResultElimination: (name: string, roleName?: string) =>
    roleName
      ? `Le village a tranché… ${name} est éliminé. Il était ${roleName}.`
      : `Le village a tranché… ${name} est éliminé.`,
  voteTie: () => "Les voix se sont partagées… Un second tour départagera les accusés.",
  voteTieNoResult: () => "Le village n'a pas su choisir… Personne ne mourra aujourd'hui.",
  scapegoatEliminated: (name: string) =>
    `Faute d'accord, la foule se retourne contre ${name}, le Bouc Émissaire… qui paie pour tous.`,
  idiotSpared: (name: string) =>
    `${name} était l'Idiot du Village ! On l'épargne en riant… mais on ne l'écoutera plus jamais voter.`,
  ancienVotedOut: () =>
    "Le village a tué l'Ancien de ses propres mains… Avec lui s'éteignent tous les pouvoirs des villageois.",
  hunterDies: (name: string) =>
    `${name} était le Chasseur… Dans un dernier souffle, il arme son fusil.`,
  victory: (message: string) => message,
} as const;

function ordinal(n: number): string {
  if (n === 1) return 'première';
  if (n === 2) return 'deuxième';
  if (n === 3) return 'troisième';
  return `${n}ᵉ`;
}

export function roleName(roleId: RoleId): string {
  return getRole(roleId).name;
}
