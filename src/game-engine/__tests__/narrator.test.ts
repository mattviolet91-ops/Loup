import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NARRATION } from '../narrator';
import type { NarrationPhrase, VictoryResult } from '../types';

const victory = (winner: VictoryResult['winner']): VictoryResult => ({
  winner,
  winningPlayerIds: [],
  message: 'Message de victoire.',
});

/** Toutes les phrases que le moteur peut prononcer, dans toutes leurs variantes. */
const ALL_PHRASES: NarrationPhrase[] = [
  NARRATION.gameStart(),
  NARRATION.roleRevealStart(),
  NARRATION.nightFalls(1),
  NARRATION.nightFalls(2),
  NARRATION.thiefTurn(),
  NARRATION.cupidTurn(),
  NARRATION.loversWake(),
  NARRATION.salvateurTurn(),
  NARRATION.voyanteTurn(),
  NARRATION.wolvesTurn(),
  NARRATION.petiteFilleTurn(),
  NARRATION.petiteFilleSpotted(),
  NARRATION.sorciereTurn(true),
  NARRATION.sorciereTurn(false),
  NARRATION.fluteTurn(),
  NARRATION.dayBreaks(),
  NARRATION.noOneDied(),
  NARRATION.someoneDied(1),
  NARRATION.someoneDied(3),
  NARRATION.voteStart(),
  NARRATION.voteResultElimination(),
  NARRATION.voteTie(),
  NARRATION.voteTieNoResult(),
  NARRATION.scapegoatEliminated(),
  NARRATION.idiotSpared(),
  NARRATION.ancienVotedOut(),
  NARRATION.hunterDies(),
  NARRATION.victory(victory('VILLAGE')),
  NARRATION.victory(victory('WEREWOLVES')),
  NARRATION.victory(victory('LOVERS')),
  NARRATION.victory(victory('JOUEUR_DE_FLUTE')),
];

describe('narration', () => {
  it('fournit un texte et un clip pour chaque phrase', () => {
    for (const phrase of ALL_PHRASES) {
      expect(phrase.text.length, JSON.stringify(phrase)).toBeGreaterThan(0);
      expect(phrase.clip, phrase.text).toMatch(/^\d{2}-[a-z0-9-]+$/);
    }
  });

  it('associe un clip distinct à chaque phrase distincte', () => {
    const byClip = new Map<string, string>();
    for (const phrase of ALL_PHRASES) {
      const known = byClip.get(phrase.clip);
      // Un même clip ne doit jamais porter deux textes différents.
      if (known !== undefined) expect(known).toBe(phrase.text);
      byClip.set(phrase.clip, phrase.text);
    }
    // `victory` réutilise le message du moteur : 31 clips pour 31 enregistrements.
    expect(byClip.size).toBe(31);
  });

  it("n'insère jamais de donnée propre à la partie dans le texte enregistré", () => {
    // Les enregistrements sont figés : un prénom, un rôle ou un numéro de jour
    // dans le texte signifierait que le clip ne peut pas correspondre au texte.
    // (Les messages de victoire viennent du moteur et sont, eux, figés.)
    const recorded = ALL_PHRASES.filter((p) => !p.clip.startsWith('2') || !p.clip.includes('victoire'));
    for (const phrase of recorded) {
      expect(phrase.text, phrase.clip).not.toMatch(/\d/);
    }
  });

  it('reste synchronisé avec scripts/narration-lines.json', () => {
    // Ce fichier sert de source au découpage de l'enregistrement
    // (`scripts/split-narration.mjs`). S'il dérivait du moteur, les clips
    // seraient découpés sur des textes qui ne sont plus dits : le test échoue
    // donc dès qu'une phrase change ici sans être reportée là-bas.
    const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
    const script: { clip: string; text: string }[] = JSON.parse(read('scripts/narration-lines.json'));
    const engine = new Map(ALL_PHRASES.map((p) => [p.clip, p.text]));

    expect(script.map((l) => l.clip).sort()).toEqual([...engine.keys()].sort());

    // Les messages de victoire viennent du moteur de victoire, pas du
    // narrateur : `ALL_PHRASES` ne porte qu'un message factice pour eux.
    const victorySource = read('src/game-engine/victorySystem.ts');
    for (const line of script) {
      if (line.clip.includes('victoire')) {
        expect(victorySource, line.clip).toContain(line.text);
      } else {
        expect(line.text, line.clip).toBe(engine.get(line.clip));
      }
    }
  });
});
