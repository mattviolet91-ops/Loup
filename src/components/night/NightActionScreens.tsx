import { useState } from 'react';
import type { GameAction } from '../../game-engine/engine';
import type { GameState } from '../../game-engine/types';
import { getRole } from '../../game-engine/roles';
import { findPlayer, alivePlayers, aliveByRole } from '../../game-engine/selectors';
import { currentWolfVictimId } from '../../game-engine/actionSystem';
import { Button } from '../common/Button';
import { PlayerPicker } from '../common/PlayerPicker';

interface ActionProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export function VoleurScreen({ state, dispatch }: ActionProps) {
  const extra = state.special.voleurExtraRoles;
  const mandatory = extra.length === 2 && extra.every((r) => r === 'LOUP_GAROU');

  return (
    <div className="stack-lg">
      <p className="screen-subtitle">
        Voici les deux cartes non distribuées. Tu peux échanger ta carte contre l'une d'elles.
      </p>
      <div className="stack">
        {extra.map((roleId, i) => {
          const role = getRole(roleId);
          return (
            <div className="card" key={i} style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '2rem' }}>{role.emoji}</span>
              <div style={{ fontWeight: 700, marginTop: 4 }}>{role.name}</div>
            </div>
          );
        })}
      </div>
      <div className="stack">
        {mandatory && (
          <p className="validation-box invalid" style={{ textAlign: 'center' }}>
            Les deux cartes sont des Loups-Garous : l'échange est obligatoire.
          </p>
        )}
        {extra.map((roleId, i) => (
          <Button
            key={i}
            variant="primary"
            onClick={() => dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'VOLEUR', swapWith: roleId } })}
          >
            Échanger contre {getRole(roleId).name}
          </Button>
        ))}
        {!mandatory && (
          <Button onClick={() => dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'VOLEUR', swapWith: null } })}>
            Garder ma carte
          </Button>
        )}
      </div>
    </div>
  );
}

export function CupidonScreen({ state, dispatch }: ActionProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const options = state.players.map((p) => ({ id: p.id, name: p.name }));

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="stack-lg">
      <p className="screen-subtitle">Choisis les deux joueurs qui tomberont amoureux ({selected.length}/2).</p>
      <PlayerPicker
        options={options.map((o) => ({ ...o, disabled: !selected.includes(o.id) && selected.length >= 2 }))}
        selectedIds={selected}
        onToggle={toggle}
      />
      <Button
        variant="primary"
        disabled={selected.length !== 2}
        onClick={() =>
          dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'CUPIDON', targetIds: [selected[0]!, selected[1]!] } })
        }
      >
        Confirmer les Amoureux
      </Button>
    </div>
  );
}

export function LoversRevealScreen({ state, dispatch }: ActionProps) {
  const ids = state.special.cupidLoverIds ?? [];
  const lovers = ids.map((id) => findPlayer(state, id));

  return (
    <div className="stack-lg" style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '2.5rem' }} aria-hidden="true">
        💘
      </span>
      <h2 className="screen-title">Vous êtes désormais Amoureux</h2>
      <div className="stack">
        {lovers.map((p) => (
          <div className="card" key={p.id}>
            <strong>{p.name}</strong> — {getRole(p.roleId).emoji} {getRole(p.roleId).name}
          </div>
        ))}
      </div>
      <p className="screen-subtitle">
        Si l'un de vous meurt, l'autre meurt de chagrin. Si vous êtes les deux derniers survivants, vous gagnez
        ensemble.
      </p>
      <Button variant="primary" onClick={() => dispatch({ type: 'NIGHT_ACK' })}>
        Nous avons compris, se rendormir
      </Button>
    </div>
  );
}

export function SalvateurScreen({ state, dispatch }: ActionProps) {
  const lastProtected = state.special.salvateurLastProtectedId;
  const options = alivePlayers(state).map((p) => ({
    id: p.id,
    name: p.name,
    disabled: p.id === lastProtected,
    hint: p.id === lastProtected ? 'protégé la nuit dernière' : undefined,
  }));
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="stack-lg">
      <p className="screen-subtitle">Choisis le joueur que tu protèges cette nuit contre les Loups-Garous.</p>
      <PlayerPicker options={options} selectedIds={selected ? [selected] : []} onToggle={setSelected} />
      <Button
        variant="primary"
        disabled={!selected}
        onClick={() => dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'SALVATEUR', targetId: selected! } })}
      >
        Confirmer la protection
      </Button>
    </div>
  );
}

export function VoyanteScreen({ state, dispatch }: ActionProps) {
  const seer = aliveByRole(state, 'VOYANTE')[0]!;
  const result = state.night?.seerResult ?? null;
  const [selected, setSelected] = useState<string | null>(null);

  if (result) {
    const target = findPlayer(state, result.targetId);
    const role = getRole(result.roleId);
    return (
      <div className="stack-lg" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }}>🔮</span>
        <p className="screen-subtitle">{target.name} est :</p>
        <div className="role-card">
          <span className="role-emoji">{role.emoji}</span>
          <div className="role-name">{role.name}</div>
        </div>
        <Button variant="primary" onClick={() => dispatch({ type: 'NIGHT_ACK' })}>
          J'ai compris, me rendormir
        </Button>
      </div>
    );
  }

  const options = alivePlayers(state)
    .filter((p) => p.id !== seer.id)
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="stack-lg">
      <p className="screen-subtitle">Choisis un joueur pour découvrir son rôle.</p>
      <PlayerPicker options={options} selectedIds={selected ? [selected] : []} onToggle={setSelected} />
      <Button
        variant="primary"
        disabled={!selected}
        onClick={() => dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'VOYANTE', targetId: selected! } })}
      >
        Découvrir son rôle
      </Button>
    </div>
  );
}

export function WolvesScreen({ state, dispatch, wolfId }: ActionProps & { wolfId: string }) {
  const wolf = findPlayer(state, wolfId);
  const wolves = aliveByRole(state, 'LOUP_GAROU');
  const [selected, setSelected] = useState<string | null>(null);
  const options = alivePlayers(state)
    .filter((p) => p.roleId !== 'LOUP_GAROU')
    .map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="stack-lg">
      <p className="screen-subtitle">
        {wolf.name}, voici la meute : {wolves.map((w) => w.name).join(', ')}. Choisis la victime de cette nuit.
      </p>
      <PlayerPicker options={options} selectedIds={selected ? [selected] : []} onToggle={setSelected} />
      <Button
        variant="primary"
        disabled={!selected}
        onClick={() =>
          dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'LOUP_GAROU', wolfId, targetId: selected! } })
        }
      >
        Confirmer l'attaque
      </Button>
    </div>
  );
}

export function PetiteFilleScreen({ state, dispatch }: ActionProps) {
  const spotted = state.night?.petiteFilleSpySpotted ?? null;

  if (spotted !== null) {
    return (
      <div className="stack-lg" style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }}>{spotted ? '😱' : '🙈'}</span>
        <p className="screen-subtitle">
          {spotted
            ? 'Un loup a senti ton regard : tu es repérée !'
            : "Tu as pu espionner sans te faire remarquer."}
        </p>
        <Button variant="primary" onClick={() => dispatch({ type: 'NIGHT_ACK' })}>
          Me rendormir
        </Button>
      </div>
    );
  }

  return (
    <div className="stack-lg" style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '2.5rem' }}>👧</span>
      <p className="screen-subtitle">
        Veux-tu entrouvrir les yeux pour espionner les Loups-Garous ? Tu risques de te faire repérer et de devenir
        leur victime à la place.
      </p>
      <div className="stack">
        <Button
          variant="primary"
          onClick={() => dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'PETITE_FILLE', spy: true } })}
        >
          Oui, j'espionne
        </Button>
        <Button onClick={() => dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'PETITE_FILLE', spy: false } })}>
          Non, je garde les yeux fermés
        </Button>
      </div>
    </div>
  );
}

export function SorciereScreen({ state, dispatch }: ActionProps) {
  const victimId = currentWolfVictimId(state);
  const victim = victimId ? findPlayer(state, victimId) : null;
  const canHeal = !state.special.witchHealUsed && victim !== null;
  const canPoison = !state.special.witchPoisonUsed;

  const [heal, setHeal] = useState(false);
  const [poisonTargetId, setPoisonTargetId] = useState<string | null>(null);

  const poisonOptions = alivePlayers(state).map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="stack-lg">
      <p className="screen-subtitle">
        {victim ? `Cette nuit, les Loups-Garous ont attaqué ${victim.name}.` : "Les Loups-Garous n'ont attaqué personne."}
      </p>
      {canHeal && (
        <Button variant={heal ? 'primary' : 'secondary'} onClick={() => setHeal((h) => !h)}>
          🧪 {heal ? 'Potion de vie sélectionnée' : `Utiliser la potion de vie sur ${victim!.name}`}
        </Button>
      )}
      {canPoison && (
        <div className="stack">
          <p className="screen-subtitle">Potion de mort (facultative) :</p>
          <PlayerPicker
            options={poisonOptions}
            selectedIds={poisonTargetId ? [poisonTargetId] : []}
            onToggle={(id) => setPoisonTargetId((prev) => (prev === id ? null : id))}
          />
        </div>
      )}
      <Button
        variant="primary"
        onClick={() =>
          dispatch({
            type: 'NIGHT_ACTION',
            payload: { kind: 'SORCIERE', heal, poisonTargetId },
          })
        }
      >
        Valider
      </Button>
    </div>
  );
}

export function FluteScreen({ state, dispatch }: ActionProps) {
  const flute = aliveByRole(state, 'JOUEUR_DE_FLUTE')[0]!;
  const [selected, setSelected] = useState<string[]>([]);
  const eligible = alivePlayers(state).filter((p) => p.id !== flute.id);
  const maxSelectable = Math.min(2, eligible.length);
  const options = eligible.map((p) => ({
    id: p.id,
    name: p.name,
    hint: p.charmed ? 'déjà charmé' : undefined,
  }));

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxSelectable) return prev;
      return [...prev, id];
    });
  }

  return (
    <div className="stack-lg">
      <p className="screen-subtitle">
        Choisis {maxSelectable === 2 ? 'deux joueurs' : 'un joueur'} à charmer ({selected.length}/{maxSelectable}).
      </p>
      <PlayerPicker
        options={options.map((o) => ({ ...o, disabled: !selected.includes(o.id) && selected.length >= maxSelectable }))}
        selectedIds={selected}
        onToggle={toggle}
      />
      <Button
        variant="primary"
        disabled={selected.length !== maxSelectable}
        onClick={() => dispatch({ type: 'NIGHT_ACTION', payload: { kind: 'JOUEUR_DE_FLUTE', targetIds: selected } })}
      >
        Charmer
      </Button>
    </div>
  );
}
