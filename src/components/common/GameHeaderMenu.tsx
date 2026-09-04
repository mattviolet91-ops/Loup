interface GameHeaderMenuProps {
  onSettings: () => void;
  onAbandon: () => void;
}

export function GameHeaderMenu({ onSettings, onAbandon }: GameHeaderMenuProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="icon-button" onClick={onSettings} aria-label="Paramètres">
        ⚙️
      </button>
      <button
        className="icon-button"
        onClick={() => {
          if (window.confirm('Abandonner la partie en cours et revenir à l\'accueil ?')) {
            onAbandon();
          }
        }}
        aria-label="Abandonner la partie"
      >
        🏳️
      </button>
    </div>
  );
}
