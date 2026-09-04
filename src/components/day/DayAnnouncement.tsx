import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { getRole } from '../../game-engine/roles';
import { Button } from '../common/Button';
import { NarratorBar } from '../common/NarratorBar';
import { GameHeaderMenu } from '../common/GameHeaderMenu';
import type { useNarrator } from '../../hooks/useNarrator';

interface DayAnnouncementProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  narrator: ReturnType<typeof useNarrator>;
  lastNarrationText: string | null;
  onUpdateOptions: (patch: Partial<GameState['config']['options']>) => void;
  onSettings: () => void;
  onAbandon: () => void;
}

export function DayAnnouncement({
  state,
  dispatch,
  narrator,
  lastNarrationText,
  onUpdateOptions,
  onSettings,
  onAbandon,
}: DayAnnouncementProps) {
  const deadThisCycle = state.players.filter((p) => state.lastCycleDeaths.includes(p.id));

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="badge">☀️ Jour {state.dayNumber}</span>
        <GameHeaderMenu onSettings={onSettings} onAbandon={onAbandon} />
      </div>
      <NarratorBar
        text={lastNarrationText}
        enabled={state.config.options.narrationEnabled}
        isSpeaking={narrator.isSpeaking}
        onToggleEnabled={() => onUpdateOptions({ narrationEnabled: !state.config.options.narrationEnabled })}
        onRepeat={narrator.repeatLast}
        onSkip={narrator.stop}
      />

      <div className="stack-lg">
        <h1 className="screen-title" style={{ textAlign: 'center' }}>
          Le jour se lève sur le village
        </h1>
        {deadThisCycle.length === 0 ? (
          <p className="screen-subtitle" style={{ textAlign: 'center' }}>
            Miracle : cette nuit, personne n'est mort.
          </p>
        ) : (
          <ul className="death-list">
            {deadThisCycle.map((p) => (
              <li key={p.id}>
                <span aria-hidden="true">☠️</span>
                <span>
                  <strong>{p.name}</strong>
                  {state.config.options.revealRoleOnDeath && (
                    <>
                      {' '}
                      — {getRole(p.roleId).emoji} {getRole(p.roleId).name}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="primary" onClick={() => dispatch({ type: 'START_DISCUSSION' })}>
          Lancer la discussion
        </Button>
      </div>
    </div>
  );
}
