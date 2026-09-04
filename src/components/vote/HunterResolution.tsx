import { useState } from 'react';
import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { findPlayer, alivePlayers } from '../../game-engine/selectors';
import { Button } from '../common/Button';
import { PlayerPicker } from '../common/PlayerPicker';

interface HunterResolutionProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export function HunterResolution({ state, dispatch }: HunterResolutionProps) {
  const hunterInfo = state.hunter!;
  const hunter = findPlayer(state, hunterInfo.hunterId);
  const [selected, setSelected] = useState<string | null>(null);
  const options = alivePlayers(state)
    .filter((p) => p.id !== hunter.id)
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="badge">🏹 Chasseur</span>
      </div>
      <div className="stack-lg" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }} aria-hidden="true">
          🏹
        </span>
        <h1 className="screen-title">{hunter.name} était le Chasseur !</h1>
        <p className="screen-subtitle">Avant de mourir, il désigne un dernier joueur à abattre.</p>
        <PlayerPicker options={options} selectedIds={selected ? [selected] : []} onToggle={setSelected} />
        <Button
          variant="primary"
          disabled={!selected}
          onClick={() => dispatch({ type: 'HUNTER_SHOOT', targetId: selected! })}
        >
          Tirer
        </Button>
      </div>
    </div>
  );
}
