// Textes du narrateur. Ce module ne fait AUCUN appel à une API de synthèse
// vocale : il ne fournit que des chaînes de caractères. La lecture à voix
// haute est branchée côté UI par `useNarrator` (Web Speech API), afin que le
// moteur de jeu reste testable et indépendant du navigateur.
import { getRole } from './roles';
import type { RoleId } from './types';

export const NARRATION = {
  gameStart: () => 'Bienvenue à Thiercelieux. La partie va commencer, que le sort en soit jeté.',
  nightFalls: (n: number) =>
    n === 1
      ? 'La nuit tombe sur le village pour la première fois. Que tout le monde ferme les yeux.'
      : `La nuit tombe à nouveau sur le village. Tout le monde ferme les yeux.`,
  roleWakes: (roleName: string) => `${roleName}, réveille-toi.`,
  roleSleeps: (roleName: string) => `${roleName}, rendors-toi.`,
  thiefTurn: () => 'Le Voleur se réveille et découvre les deux cartes restantes.',
  cupidTurn: () => "Cupidon se réveille et choisit deux joueurs qui tomberont amoureux.",
  loversWake: () => 'Les Amoureux se reconnaissent en secret, puis se rendorment.',
  salvateurTurn: () => 'Le Salvateur se réveille et désigne la personne qu\'il protège cette nuit.',
  voyanteTurn: () => "La Voyante se réveille et peut découvrir l'identité d'un joueur.",
  wolvesTurn: () => 'Les Loups-Garous se réveillent, se reconnaissent, et choisissent leur victime.',
  petiteFilleTurn: () => "La Petite Fille peut entrouvrir les yeux pour espionner les Loups-Garous, à ses risques et périls.",
  petiteFilleSpotted: () => "La Petite Fille s'est fait repérer par les Loups-Garous !",
  sorciereTurn: (victimName: string | null) =>
    victimName
      ? `La Sorcière se réveille. Cette nuit, les Loups-Garous ont attaqué ${victimName}.`
      : 'La Sorcière se réveille.',
  fluteTurn: () => 'Le Joueur de Flûte se réveille et charme deux nouveaux villageois.',
  nightResolution: () => 'Le village va bientôt se réveiller.',
  dayBreaks: (n: number) => `Le jour se lève sur le village, pour la ${ordinal(n)} fois.`,
  noOneDied: () => "Miracle : cette nuit, personne n'est mort.",
  someoneDied: (names: string[]) =>
    names.length === 1
      ? `Cette nuit, le village pleure la disparition de ${names[0]}.`
      : `Cette nuit, le village pleure la disparition de ${names.join(' et de ')}.`,
  discussionStart: () => "La parole est au village. Discutez, accusez, défendez-vous.",
  voteStart: () => "Le moment est venu de voter. Que chacun désigne, en son âme et conscience, celui qu'il soupçonne.",
  passPhoneTo: (name: string) => `Passez le téléphone à ${name}.`,
  voteResultElimination: (name: string, roleName?: string) =>
    roleName
      ? `${name} est éliminé par le village. Il était ${roleName}.`
      : `${name} est éliminé par le village.`,
  voteTie: () => 'Égalité des voix : un second tour de vote va départager les candidats.',
  voteTieNoResult: () => "L'égalité persiste : personne n'est éliminé aujourd'hui.",
  scapegoatEliminated: (name: string) =>
    `Égalité des voix : ${name}, le Bouc Émissaire, paie pour le village et est éliminé à la place.`,
  hunterDies: (name: string) => `${name} était le Chasseur ! Avant de mourir, il peut abattre un dernier joueur.`,
  idiotSpared: (name: string) => `${name} était l'Idiot du Village ! Le village le laisse en vie, mais il perd le droit de voter.`,
  ancienVotedOut: () =>
    "Le village a éliminé l'Ancien par erreur : tous les villageois perdent désormais leurs pouvoirs !",
  victory: (message: string) => message,
  gameSaved: () => 'La partie a été sauvegardée sur cet appareil.',
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
