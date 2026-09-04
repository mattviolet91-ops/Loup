import type { GameState } from '../../game-engine/types';
import { Button } from '../common/Button';

interface VictoryProps {
  state: GameState;
  onSummary: () => void;
  onHome: () => void;
}

const WINNER_LABEL: Record<string, string> = {
  VILLAGE: '🧑‍🌾 Le Village',
  WEREWOLVES: '🐺 Les Loups-Garous',
  LOVERS: '💘 Les Amoureux',
  JOUEUR_DE_FLUTE: '🪈 Le Joueur de Flûte',
};

export function Victory({ state, onSummary, onHome }: VictoryProps) {
  const victory = state.victory!;

  return (
    <div className="screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div className="stack-lg">
        <span style={{ fontSize: '3.5rem' }} aria-hidden="true">
          🏆
        </span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>VICTOIRE</h1>
        <p className="screen-subtitle" style={{ fontSize: '1.05rem' }}>
          {WINNER_LABEL[victory.winner]} remporte la partie !
        </p>
        <p className="screen-subtitle">{victory.message}</p>
        <div className="stack">
          <Button variant="primary" onClick={onSummary}>
            📋 Voir le résumé de la partie
          </Button>
          <Button onClick={onHome}>🏠 Retour à l'accueil</Button>
        </div>
      </div>
    </div>
  );
}
