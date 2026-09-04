import { Button } from '../common/Button';

interface HomeScreenProps {
  onNewGame: () => void;
  onRules: () => void;
  onHowTo: () => void;
  onSettings: () => void;
  hasSavedGame: boolean;
  onResume: () => void;
}

export function HomeScreen({ onNewGame, onRules, onHowTo, onSettings, hasSavedGame, onResume }: HomeScreenProps) {
  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div className="stack-lg" style={{ textAlign: 'center' }}>
        <div>
          <span className="wolf-emoji" aria-hidden="true">
            🐺
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 8 }}>LOUP-GAROU</h1>
          <p className="screen-subtitle" style={{ marginTop: 6 }}>
            Le village vous attend.
          </p>
        </div>

        <div className="stack">
          {hasSavedGame && (
            <Button variant="primary" onClick={onResume}>
              ▶️ Reprendre la partie
            </Button>
          )}
          <Button variant={hasSavedGame ? 'secondary' : 'primary'} onClick={onNewGame}>
            🌙 Nouvelle partie
          </Button>
          <Button onClick={onRules}>📜 Règles</Button>
          <Button onClick={onHowTo}>❓ Comment jouer</Button>
          <Button onClick={onSettings}>⚙️ Paramètres</Button>
        </div>
      </div>
      <p className="footer-note">Une seule application, un seul téléphone, aucun serveur.</p>
    </div>
  );
}
