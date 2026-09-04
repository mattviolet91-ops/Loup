import type { GameOptions } from '../../game-engine/types';
import { Button } from '../common/Button';

interface SettingsScreenProps {
  options: GameOptions;
  voices: SpeechSynthesisVoice[];
  onChange: (patch: Partial<GameOptions>) => void;
  onBack: () => void;
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className="switch"
        data-on={on}
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

export function SettingsScreen({ options, voices, onChange, onBack }: SettingsScreenProps) {
  const frenchVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
  const voiceList = frenchVoices.length > 0 ? frenchVoices : voices;

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Retour">
          ←
        </button>
        <h1 className="screen-title">Paramètres</h1>
        <span style={{ width: 40 }} />
      </div>

      <div className="stack-lg">
        <section className="card stack">
          <h2 style={{ fontSize: '1.05rem' }}>Narrateur vocal</h2>
          <Toggle
            label="Voix activée"
            on={options.narrationEnabled}
            onToggle={() => onChange({ narrationEnabled: !options.narrationEnabled })}
          />
          <div className="field">
            <label htmlFor="volume">Volume ({Math.round(options.narrationVolume * 100)}%)</label>
            <input
              id="volume"
              className="slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={options.narrationVolume}
              onChange={(e) => onChange({ narrationVolume: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="rate">Vitesse de narration ({options.narrationRate.toFixed(2)}x)</label>
            <input
              id="rate"
              className="slider"
              type="range"
              min={0.6}
              max={1.6}
              step={0.05}
              value={options.narrationRate}
              onChange={(e) => onChange({ narrationRate: Number(e.target.value) })}
            />
          </div>
          {voiceList.length > 0 && (
            <div className="field">
              <label htmlFor="voice">Voix</label>
              <select
                id="voice"
                value={options.narrationVoiceURI ?? ''}
                onChange={(e) => onChange({ narrationVoiceURI: e.target.value || null })}
                style={{
                  minHeight: 'var(--touch-min)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '0 12px',
                }}
              >
                <option value="">Voix par défaut du navigateur</option>
                {voiceList.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: '1.05rem' }}>Affichage</h2>
          <Toggle
            label="Animations"
            on={options.animationsEnabled}
            onToggle={() => onChange({ animationsEnabled: !options.animationsEnabled })}
          />
          <Toggle
            label="Contraste élevé"
            on={options.highContrast}
            onToggle={() => onChange({ highContrast: !options.highContrast })}
          />
          <Toggle
            label="Révéler le rôle des joueurs éliminés"
            on={options.revealRoleOnDeath}
            onToggle={() => onChange({ revealRoleOnDeath: !options.revealRoleOnDeath })}
          />
        </section>

        <section className="card stack">
          <h2 style={{ fontSize: '1.05rem' }}>Rythme de partie</h2>
          <div className="field">
            <label htmlFor="discussion">
              Durée indicative des discussions ({Math.round(options.discussionDurationSeconds / 60)} min)
            </label>
            <input
              id="discussion"
              className="slider"
              type="range"
              min={60}
              max={600}
              step={30}
              value={options.discussionDurationSeconds}
              onChange={(e) => onChange({ discussionDurationSeconds: Number(e.target.value) })}
            />
          </div>
        </section>
      </div>

      <Button onClick={onBack} style={{ marginTop: 24 }}>
        Retour
      </Button>
    </div>
  );
}
