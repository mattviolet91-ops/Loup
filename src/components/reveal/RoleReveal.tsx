import { useState } from 'react';
import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { getRole } from '../../game-engine/roles';
import { usePassDevice } from '../../hooks/usePassDevice';
import { Button } from '../common/Button';
import { PassDeviceScreen } from '../common/PassDeviceScreen';

interface RoleRevealProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

const TEAM_LABEL: Record<string, string> = {
  VILLAGE: 'Village',
  WEREWOLVES: 'Loups-Garous',
  INDEPENDENT: 'Camp indépendant',
};

export function RoleReveal({ state, dispatch }: RoleRevealProps) {
  const reveal = state.roleReveal!;
  const player = state.players[reveal.currentIndex]!;
  const role = getRole(player.roleId);
  const { handedOver, confirm } = usePassDevice(player.id);
  const [cardRevealed, setCardRevealed] = useState(false);

  if (!handedOver) {
    return (
      <PassDeviceScreen
        toName={player.name}
        message={`Joueur ${reveal.currentIndex + 1} sur ${reveal.order.length}. Personne d'autre ne doit regarder l'écran.`}
        onContinue={confirm}
      />
    );
  }

  if (!cardRevealed) {
    return (
      <div className="screen" style={{ justifyContent: 'center' }}>
        <div className="stack-lg" style={{ textAlign: 'center' }}>
          <p className="screen-subtitle">{player.name}, c'est ton tour.</p>
          <Button variant="primary" onClick={() => setCardRevealed(true)}>
            👁️ Voir mon rôle
          </Button>
        </div>
      </div>
    );
  }

  const teamClass = role.team === 'VILLAGE' ? 'village' : role.team === 'WEREWOLVES' ? 'wolves' : 'independent';

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div className="role-card">
        <span className="role-emoji" aria-hidden="true">
          {role.emoji}
        </span>
        <div className="role-name">{role.name}</div>
        <span className={`role-team ${teamClass}`}>{TEAM_LABEL[role.team]}</span>
        <p className="role-desc">{role.description}</p>
      </div>
      <div style={{ marginTop: 24 }}>
        <Button
          variant="primary"
          onClick={() => {
            setCardRevealed(false);
            dispatch({ type: 'ACK_ROLE_SEEN' });
          }}
        >
          J'ai mémorisé mon rôle
        </Button>
      </div>
    </div>
  );
}
