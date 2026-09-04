import { useEffect, useState } from 'react';
import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { Button } from '../common/Button';
import { GameHeaderMenu } from '../common/GameHeaderMenu';

interface DiscussionProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  onSettings: () => void;
  onAbandon: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  return `${seconds < 0 ? '-' : ''}${m}:${s.toString().padStart(2, '0')}`;
}

export function Discussion({ state, dispatch, onSettings, onAbandon }: DiscussionProps) {
  const [secondsLeft, setSecondsLeft] = useState(state.config.options.discussionDurationSeconds);

  useEffect(() => {
    const interval = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const alivePlayers = state.players.filter((p) => p.alive);

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="badge">🗣️ Discussion</span>
        <GameHeaderMenu onSettings={onSettings} onAbandon={onAbandon} />
      </div>
      <div className="stack-lg" style={{ textAlign: 'center' }}>
        <p className="screen-subtitle">Le village débat à voix haute. Qui soupçonnez-vous ?</p>
        <div className="timer" style={{ color: secondsLeft <= 0 ? 'var(--danger)' : undefined }}>
          {formatTime(secondsLeft)}
        </div>
        <p className="footer-note" style={{ margin: 0 }}>
          Durée indicative — rien ne vous empêche de continuer ou d'écourter le débat.
        </p>
        <div className="tag-row" style={{ justifyContent: 'center' }}>
          {alivePlayers.map((p) => (
            <span className="badge" key={p.id}>
              {p.name}
            </span>
          ))}
        </div>
        <Button variant="primary" onClick={() => dispatch({ type: 'END_DISCUSSION' })}>
          Terminer les discussions et voter
        </Button>
      </div>
    </div>
  );
}
