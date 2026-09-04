import type { GameState, VoteState } from './types';
import { alivePlayers, aliveActivePowerHolder } from './selectors';

export function startVote(state: GameState): VoteState {
  const allowedOverride = state.special.boucEmissaireAllowedVoters;
  let eligible = alivePlayers(state).filter((p) => p.canVote);
  if (allowedOverride && allowedOverride.length > 0) {
    const allowedSet = new Set(allowedOverride);
    eligible = eligible.filter((p) => allowedSet.has(p.id));
  }
  const candidates = alivePlayers(state).map((p) => p.id);
  return {
    round: 1,
    eligibleVoterIds: eligible.map((p) => p.id),
    candidateIds: candidates,
    voterOrder: eligible.map((p) => p.id),
    voterIndex: 0,
    votes: {},
    tally: null,
    eliminatedId: null,
    wasTieBrokenByScapegoat: false,
    noElimination: false,
  };
}

export function castVote(vote: VoteState, voterId: string, targetId: string | 'ABSTAIN'): VoteState {
  return {
    ...vote,
    votes: { ...vote.votes, [voterId]: targetId },
    voterIndex: vote.voterIndex + 1,
  };
}

export function isVoteRoundComplete(vote: VoteState): boolean {
  return vote.voterIndex >= vote.voterOrder.length;
}

/** Résout un tour de vote terminé. Peut renvoyer soit un résultat final, soit un nouveau tour (égalité). */
export function resolveVoteRound(state: GameState, vote: VoteState): VoteState {
  const counts: Record<string, number> = {};
  for (const v of Object.values(vote.votes)) {
    if (v !== 'ABSTAIN') counts[v] = (counts[v] ?? 0) + 1;
  }
  const values = Object.values(counts);
  const max = values.length > 0 ? Math.max(...values) : 0;

  if (max === 0) {
    return { ...vote, tally: counts, noElimination: true, eliminatedId: null };
  }

  const top = Object.entries(counts)
    .filter(([, count]) => count === max)
    .map(([id]) => id);

  if (top.length === 1) {
    return { ...vote, tally: counts, eliminatedId: top[0]! };
  }

  if (vote.round === 1) {
    const scapegoat = aliveActivePowerHolder(state, 'BOUC_EMISSAIRE');
    if (scapegoat) {
      return { ...vote, tally: counts, eliminatedId: scapegoat.id, wasTieBrokenByScapegoat: true };
    }
    return {
      round: 2,
      eligibleVoterIds: vote.eligibleVoterIds,
      candidateIds: top,
      voterOrder: vote.eligibleVoterIds,
      voterIndex: 0,
      votes: {},
      tally: null,
      eliminatedId: null,
      wasTieBrokenByScapegoat: false,
      noElimination: false,
    };
  }

  return { ...vote, tally: counts, noElimination: true, eliminatedId: null };
}

export function isVoteFinal(vote: VoteState): boolean {
  return vote.eliminatedId !== null || vote.noElimination;
}
