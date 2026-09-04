import { useMemo, useState } from 'react';
import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  createDefaultConfig,
  defaultRoleCountsFor,
  generatePlayerNames,
  maxWolvesFor,
  validateGameConfig,
  validatePlayerNames,
} from '../../game-engine/config';
import { ROLE_LIST } from '../../game-engine/roles';
import type { GameConfig, RoleCounts, RoleId } from '../../game-engine/types';
import { Button } from '../common/Button';

interface NewGameSetupProps {
  onCancel: () => void;
  onCreate: (config: GameConfig, playerNames: string[]) => void;
}

type Step = 'COUNT' | 'NAMES' | 'ROLES';

export function NewGameSetup({ onCancel, onCreate }: NewGameSetupProps) {
  const [step, setStep] = useState<Step>('COUNT');
  const [playerCount, setPlayerCount] = useState(8);
  const [names, setNames] = useState<string[]>(Array.from({ length: 8 }, () => ''));
  const [roleCounts, setRoleCounts] = useState<RoleCounts>(defaultRoleCountsFor(8));

  const config: GameConfig = useMemo(
    () => ({ ...createDefaultConfig(playerCount), roleCounts }),
    [playerCount, roleCounts],
  );
  const configValidation = useMemo(() => validateGameConfig(config), [config]);
  const namesValidation = useMemo(() => validatePlayerNames(names, playerCount), [names, playerCount]);

  function handleCountNext() {
    setNames((prev) => Array.from({ length: playerCount }, (_, i) => prev[i] ?? ''));
    setRoleCounts(defaultRoleCountsFor(playerCount));
    setStep('NAMES');
  }

  function setRoleCount(roleId: RoleId, count: number) {
    setRoleCounts((prev) => ({ ...prev, [roleId]: Math.max(0, count) }));
  }

  const totalRoles = Object.values(roleCounts).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="icon-button" onClick={onCancel} aria-label="Annuler">
          ←
        </button>
        <h1 className="screen-title">Nouvelle partie</h1>
        <span style={{ width: 40 }} />
      </div>

      {step === 'COUNT' && (
        <div className="stack-lg">
          <p className="screen-subtitle">Combien de joueurs autour du téléphone ?</p>
          <div className="stepper">
            <button onClick={() => setPlayerCount((c) => Math.max(MIN_PLAYERS, c - 1))} aria-label="Moins de joueurs">
              −
            </button>
            <span className="stepper-value">{playerCount}</span>
            <button
              onClick={() => setPlayerCount((c) => Math.min(MAX_PLAYERS, c + 1))}
              aria-label="Plus de joueurs"
            >
              +
            </button>
          </div>
          <p className="footer-note" style={{ marginTop: 0 }}>
            De {MIN_PLAYERS} à {MAX_PLAYERS} joueurs.
          </p>
          <Button variant="primary" onClick={handleCountNext}>
            Suivant
          </Button>
        </div>
      )}

      {step === 'NAMES' && (
        <div className="stack-lg">
          <p className="screen-subtitle">Le prénom de chaque joueur (dans l'ordre où le téléphone circulera).</p>
          <div className="stack">
            {names.map((name, i) => (
              <div className="field" key={i}>
                <label htmlFor={`name-${i}`}>Joueur {i + 1}</label>
                <input
                  id={`name-${i}`}
                  type="text"
                  value={name}
                  maxLength={24}
                  placeholder={`Prénom du joueur ${i + 1}`}
                  onChange={(e) =>
                    setNames((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
                  }
                />
              </div>
            ))}
          </div>
          {!namesValidation.valid && names.some((n) => n.trim().length > 0) && (
            <div className="validation-box invalid">
              <strong>À corriger :</strong>
              <ul>
                {namesValidation.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="stack">
            <Button variant="primary" disabled={!namesValidation.valid} onClick={() => setStep('ROLES')}>
              Suivant
            </Button>
            <Button onClick={() => setNames(generatePlayerNames(playerCount))}>
              🧪 Remplir automatiquement (partie test)
            </Button>
            <Button onClick={() => setStep('COUNT')}>Retour</Button>
          </div>
        </div>
      )}

      {step === 'ROLES' && (
        <div className="stack-lg">
          <p className="screen-subtitle">
            Choisissez les rôles de la partie. Total sélectionné : {totalRoles} / {playerCount}.
          </p>
          <div className="stack">
            {ROLE_LIST.map((role) => {
              const count = roleCounts[role.id] ?? 0;
              const tooFewPlayers = Boolean(role.minPlayers && playerCount < role.minPlayers);
              const max = role.id === 'LOUP_GAROU' ? maxWolvesFor(playerCount) : role.unique ? 1 : playerCount;
              return (
                <div className={`role-row${tooFewPlayers ? ' disabled' : ''}`} key={role.id}>
                  <div className="role-row-info">
                    <span style={{ fontSize: '1.4rem' }} aria-hidden="true">
                      {role.emoji}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{role.name}</div>
                      <div className="footer-note" style={{ margin: 0, textAlign: 'left' }}>
                        {tooFewPlayers ? `Nécessite ${role.minPlayers}+ joueurs` : role.summary}
                      </div>
                    </div>
                  </div>
                  {role.unique ? (
                    <button
                      type="button"
                      className="switch"
                      data-on={count > 0}
                      role="switch"
                      aria-checked={count > 0}
                      aria-label={`Inclure ${role.name}`}
                      disabled={tooFewPlayers}
                      onClick={() => setRoleCount(role.id, count > 0 ? 0 : 1)}
                    >
                      <span className="switch-knob" />
                    </button>
                  ) : (
                    <div className="role-row-count">
                      <button
                        type="button"
                        onClick={() => setRoleCount(role.id, count - 1)}
                        aria-label={`Moins de ${role.name}`}
                      >
                        −
                      </button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{count}</span>
                      <button
                        type="button"
                        onClick={() => setRoleCount(role.id, Math.min(max, count + 1))}
                        aria-label={`Plus de ${role.name}`}
                        disabled={tooFewPlayers}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {configValidation.valid ? (
            <div className="validation-box valid">✅ Configuration valide — que la partie commence !</div>
          ) : (
            <div className="validation-box invalid">
              <strong>❌ Configuration impossible</strong>
              <ul>
                {configValidation.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="stack">
            <Button
              variant="primary"
              disabled={!configValidation.valid || !namesValidation.valid}
              onClick={() => onCreate(config, names)}
            >
              🌙 Commencer la partie
            </Button>
            <Button onClick={() => setRoleCounts(defaultRoleCountsFor(playerCount))}>
              Réinitialiser la répartition recommandée
            </Button>
            <Button onClick={() => setStep('NAMES')}>Retour</Button>
          </div>
        </div>
      )}
    </div>
  );
}
