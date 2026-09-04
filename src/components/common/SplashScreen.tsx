interface SplashScreenProps {
  onSkip: () => void;
}

export function SplashScreen({ onSkip }: SplashScreenProps) {
  return (
    <button
      type="button"
      className="splash-screen"
      onClick={onSkip}
      aria-label="Passer l'écran de démarrage"
    >
      <span className="splash-text">Créé par MV26</span>
      <span className="splash-skip">Toucher pour passer</span>
    </button>
  );
}
