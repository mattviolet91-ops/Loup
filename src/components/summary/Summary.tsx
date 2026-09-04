import type { GameState } from '../../game-engine/types';
import { getRole } from '../../game-engine/roles';
import { Button } from '../common/Button';

interface SummaryProps {
  state: GameState;
  onNewGame: () => void;
  onHome: () => void;
}

export function Summary({ state, onNewGame, onHome }: SummaryProps) {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">Résumé de la partie</h1>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Rôle</th>
              <th>Statut final</th>
            </tr>
          </thead>
          <tbody>
            {state.players.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  {getRole(p.roleId).emoji} {getRole(p.roleId).name}
                  {p.startingRoleId !== p.roleId && (
                    <span className="footer-note" style={{ margin: 0 }}>
                      {' '}
                      (au départ : {getRole(p.startingRoleId).name})
                    </span>
                  )}
                </td>
                <td>{p.alive ? '🟢 Vivant' : '☠️ Éliminé'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="stack" style={{ marginTop: 24 }}>
        <Button variant="primary" onClick={onNewGame}>
          🌙 Nouvelle partie
        </Button>
        <Button onClick={onHome}>🏠 Accueil</Button>
      </div>
    </div>
  );
}
