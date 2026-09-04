import { useState } from 'react';
import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { findPlayer, alivePlayers } from '../../game-engine/selectors';
import { Button } from '../common/Button';
import { PlayerPicker } from '../common/PlayerPicker';

interface ScapegoatChoiceProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export function ScapegoatChoice({ state, dispatch }: ScapegoatChoiceProps) {
  const scapegoat = findPlayer(state, state.vote!.eliminatedId!);
  const [selected, setSelected] = useState<string[]>([]);
  const options = alivePlayers(state).map((p) => ({ id: p.id, name: p.name }));

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="badge">🐐 Bouc Émissaire</span>
      </div>
      <div className="stack-lg" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }} aria-hidden="true">
          🐐
        </span>
        <h1 className="screen-title">{scapegoat.name} paie pour l'égalité des voix</h1>
        <p className="screen-subtitle">
          En mourant, {scapegoat.name} peut désigner les seuls joueurs qui auront le droit de voter demain (ou
          personne, pour laisser tout le monde voter normalement).
        </p>
        <PlayerPicker options={options} selectedIds={selected} onToggle={toggle} />
        <div className="stack">
          <Button
            variant="primary"
            onClick={() => dispatch({ type: 'SCAPEGOAT_CHOOSE_VOTERS', voterIds: selected })}
          >
            {selected.length > 0 ? 'Restreindre le vote à ces joueurs' : 'Tout le monde pourra voter normalement'}
          </Button>
        </div>
      </div>
    </div>
  );
}
