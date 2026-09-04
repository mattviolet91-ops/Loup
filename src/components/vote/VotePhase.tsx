import { useState } from 'react';
import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { findPlayer } from '../../game-engine/selectors';
import { usePassDevice } from '../../hooks/usePassDevice';
import { PassDeviceScreen } from '../common/PassDeviceScreen';
import { Button } from '../common/Button';
import { PlayerPicker } from '../common/PlayerPicker';

interface VotePhaseProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export function VotePhase({ state, dispatch }: VotePhaseProps) {
  const vote = state.vote!;
  const voterId = vote.voterOrder[vote.voterIndex] as string | undefined;
  const { handedOver, confirm } = usePassDevice(voterId ?? null);
  const [selected, setSelected] = useState<string | 'ABSTAIN' | null>(null);

  if (!voterId) {
    return (
      <div className="screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <p className="screen-subtitle">Dépouillement du vote…</p>
      </div>
    );
  }

  const voter = findPlayer(state, voterId);

  if (!handedOver) {
    return (
      <PassDeviceScreen
        toName={voter.name}
        message={`Vote ${vote.round === 2 ? '(second tour) ' : ''}secret. Les autres ne doivent pas regarder.`}
        emoji="🗳️"
        onContinue={confirm}
      />
    );
  }

  const candidates = state.players.filter((p) => vote.candidateIds.includes(p.id));

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="badge">🗳️ Vote de {voter.name}</span>
        {vote.round === 2 && <span className="badge">Second tour</span>}
      </div>
      <div className="stack-lg">
        <p className="screen-subtitle">Qui souhaites-tu désigner ?</p>
        <PlayerPicker
          options={candidates.map((c) => ({ id: c.id, name: c.name }))}
          selectedIds={selected && selected !== 'ABSTAIN' ? [selected] : []}
          onToggle={(id) => setSelected(id)}
        />
        <Button
          variant={selected === 'ABSTAIN' ? 'primary' : 'secondary'}
          onClick={() => setSelected('ABSTAIN')}
        >
          S'abstenir
        </Button>
        <Button
          variant="primary"
          disabled={!selected}
          onClick={() => dispatch({ type: 'CAST_VOTE', voterId, targetId: selected! })}
        >
          Confirmer mon vote
        </Button>
      </div>
    </div>
  );
}
