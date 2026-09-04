interface NarratorBarProps {
  text: string | null;
  enabled: boolean;
  isSpeaking: boolean;
  onToggleEnabled: () => void;
  onRepeat: () => void;
}

export function NarratorBar({ text, enabled, isSpeaking, onToggleEnabled, onRepeat }: NarratorBarProps) {
  return (
    <div className="panel-narrator" style={{ marginBottom: 18 }}>
      <span style={{ fontSize: '1.5rem' }} aria-hidden="true">
        {!enabled ? '🔇' : isSpeaking ? '🔊' : '🎙️'}
      </span>
      <p style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.4 }}>
        {text ?? 'Le narrateur attend son prochain signal…'}
      </p>
      <button className="icon-button" onClick={onRepeat} aria-label="Répéter la dernière annonce" title="Répéter">
        🔁
      </button>
      <button
        className="icon-button"
        onClick={onToggleEnabled}
        aria-label={enabled ? 'Couper le narrateur' : 'Activer le narrateur'}
        title={enabled ? 'Couper le son' : 'Activer le son'}
      >
        {enabled ? '🔈' : '🔇'}
      </button>
    </div>
  );
}
