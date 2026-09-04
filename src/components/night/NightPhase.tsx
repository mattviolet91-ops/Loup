import type { GameAction } from '../../game-engine/engine';
import type { GameState, NightStepKind } from '../../game-engine/types';
import { currentNightStepKind, getStepActorIds } from '../../game-engine/nightOrder';
import { findPlayer } from '../../game-engine/selectors';
import { usePassDevice } from '../../hooks/usePassDevice';
import { PassDeviceScreen } from '../common/PassDeviceScreen';
import { NarratorBar } from '../common/NarratorBar';
import type { useNarrator } from '../../hooks/useNarrator';
import {
  VoleurScreen,
  CupidonScreen,
  LoversRevealScreen,
  SalvateurScreen,
  VoyanteScreen,
  WolvesScreen,
  PetiteFilleScreen,
  SorciereScreen,
  FluteScreen,
} from './NightActionScreens';

interface NightPhaseProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
  narrator: ReturnType<typeof useNarrator>;
  lastNarrationText: string | null;
  onUpdateOptions: (patch: Partial<GameState['config']['options']>) => void;
}

const STEP_MESSAGE: Record<NightStepKind, string> = {
  VOLEUR: 'Tu es le Voleur.',
  CUPIDON: 'Tu es Cupidon.',
  LOVERS_REVEAL: 'Vous êtes les deux Amoureux.',
  SALVATEUR: 'Tu es le Salvateur.',
  VOYANTE: 'Tu es la Voyante.',
  LOUP_GAROU: 'Tu fais partie des Loups-Garous.',
  PETITE_FILLE: 'Tu es la Petite Fille.',
  SORCIERE: 'Tu es la Sorcière.',
  JOUEUR_DE_FLUTE: 'Tu es le Joueur de Flûte.',
};

function computeGate(
  state: GameState,
  kind: NightStepKind | null,
): { key: string; displayName: string; wolfId?: string } {
  if (!kind) {
    return { key: 'none', displayName: '' };
  }
  if (kind === 'LOUP_GAROU') {
    const wolfIds = getStepActorIds(state, kind);
    const nextId = wolfIds.find((id) => !state.night!.wolvesVotes[id]) ?? wolfIds[0]!;
    return { key: `wolf-${nextId}`, displayName: findPlayer(state, nextId).name, wolfId: nextId };
  }
  if (kind === 'LOVERS_REVEAL') {
    const ids = getStepActorIds(state, kind);
    const names = ids.map((id) => findPlayer(state, id).name);
    return { key: `lovers-${ids.join('-')}`, displayName: names.join(' et ') };
  }
  const ids = getStepActorIds(state, kind);
  const id = ids[0];
  return { key: `${kind}-${id ?? 'none'}`, displayName: id ? findPlayer(state, id).name : '' };
}

export function NightPhase({ state, dispatch, narrator, lastNarrationText, onUpdateOptions }: NightPhaseProps) {
  const kind = currentNightStepKind(state);
  const gate = computeGate(state, kind);
  const { handedOver, confirm } = usePassDevice(gate.key);

  if (!kind || !state.night) {
    return (
      <div className="screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div className="moon" />
        <p className="screen-subtitle" style={{ marginTop: 24 }}>
          Le village dort profondément…
        </p>
      </div>
    );
  }

  if (!handedOver) {
    return (
      <PassDeviceScreen
        toName={gate.displayName}
        message={`${STEP_MESSAGE[kind]} Les autres joueurs gardent les yeux fermés.`}
        emoji="🌙"
        onContinue={confirm}
      />
    );
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="badge">🌙 Nuit {state.nightNumber}</span>
        <span className="badge">{gate.displayName}</span>
      </div>
      <NarratorBar
        text={lastNarrationText}
        enabled={state.config.options.narrationEnabled}
        isSpeaking={narrator.isSpeaking}
        onToggleEnabled={() => onUpdateOptions({ narrationEnabled: !state.config.options.narrationEnabled })}
        onRepeat={narrator.repeatLast}
        onSkip={narrator.stop}
      />
      {kind === 'VOLEUR' && <VoleurScreen state={state} dispatch={dispatch} />}
      {kind === 'CUPIDON' && <CupidonScreen state={state} dispatch={dispatch} />}
      {kind === 'LOVERS_REVEAL' && <LoversRevealScreen state={state} dispatch={dispatch} />}
      {kind === 'SALVATEUR' && <SalvateurScreen state={state} dispatch={dispatch} />}
      {kind === 'VOYANTE' && <VoyanteScreen state={state} dispatch={dispatch} />}
      {kind === 'LOUP_GAROU' && <WolvesScreen state={state} dispatch={dispatch} wolfId={gate.wolfId!} />}
      {kind === 'PETITE_FILLE' && <PetiteFilleScreen state={state} dispatch={dispatch} />}
      {kind === 'SORCIERE' && <SorciereScreen state={state} dispatch={dispatch} />}
      {kind === 'JOUEUR_DE_FLUTE' && <FluteScreen state={state} dispatch={dispatch} />}
    </div>
  );
}
