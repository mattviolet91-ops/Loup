interface NarratorBarProps {
  text: string | null;
  enabled: boolean;
  isSpeaking: boolean;
  onToggleEnabled: () => void;
  onRepeat: () => void;
  onSkip: () => void;
}

export function NarratorBar({ text, enabled, isSpeaking, onToggleEnabled, onRepeat, onSkip }: NarratorBarProps) {
  return (
    <div className="panel-narrator">
      <div className="narrator-line">
        <span style={{ fontSize: '1.5rem' }} aria-hidden="true">
          {!enabled ? '🔇' : isSpeaking ? '🔊' : '🎙️'}
        </span>
        <p style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.45 }}>
          {text ?? 'Le narrateur attend son prochain signal…'}
        </p>
      </div>
      <div className="narrator-actions">
        <button
          type="button"
          className="narrator-skip"
          onClick={onSkip}
          disabled={!isSpeaking}
          aria-label="Passer la narration en cours"
        >
          ⏭️ Passer
        </button>
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
    </div>
  );
}
