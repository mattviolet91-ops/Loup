import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { getRole } from '../../game-engine/roles';
import { findPlayer } from '../../game-engine/selectors';
import { Button } from '../common/Button';
import { GameHeaderMenu } from '../common/GameHeaderMenu';

interface VoteResultProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  onSettings: () => void;
  onAbandon: () => void;
}

export function VoteResult({ state, dispatch, onSettings, onAbandon }: VoteResultProps) {
  const vote = state.vote!;
  const target = vote.eliminatedId ? findPlayer(state, vote.eliminatedId) : null;

  let headline = "Personne n'est éliminé aujourd'hui.";
  let detail = '';
  if (target && !target.alive) {
    headline = `${target.name} est éliminé par le village.`;
    detail = state.config.options.revealRoleOnDeath
      ? `${target.name} était ${getRole(target.roleId).emoji} ${getRole(target.roleId).name}.`
      : '';
    if (vote.wasTieBrokenByScapegoat) {
      detail = `Égalité des voix : ${target.name}, le Bouc Émissaire, a payé pour le village.` + (detail ? ` ${detail}` : '');
    }
  } else if (target && target.alive && target.revealedAsIdiot) {
    headline = `${target.name} révèle qu'il est l'Idiot du Village !`;
    detail = 'Il reste en vie, mais perd définitivement son droit de vote.';
  }

  const otherDeaths = state.players.filter(
    (p) => state.lastCycleDeaths.includes(p.id) && p.id !== vote.eliminatedId,
  );

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="badge">🗳️ Résultat du vote</span>
        <GameHeaderMenu onSettings={onSettings} onAbandon={onAbandon} />
      </div>
      <div className="stack-lg" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }} aria-hidden="true">
          {target && !target.alive ? '☠️' : '🤝'}
        </span>
        <h1 className="screen-title">{headline}</h1>
        {detail && <p className="screen-subtitle">{detail}</p>}
        {otherDeaths.length > 0 && (
          <ul className="death-list">
            {otherDeaths.map((p) => (
              <li key={p.id}>
                <span aria-hidden="true">☠️</span>
                <span>
                  <strong>{p.name}</strong> — {getRole(p.roleId).name}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="primary" onClick={() => dispatch({ type: 'CONTINUE_AFTER_RESULT' })}>
          Continuer
        </Button>
      </div>
    </div>
  );
}
