import { useEffect, useState } from 'react';
import { useGame } from './hooks/useGame';
import { loadPreferredOptions, savePreferredOptions } from './utils/settingsStorage';
import type { GameOptions } from './game-engine/types';

import { SplashScreen } from './components/common/SplashScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { NewGameSetup } from './components/setup/NewGameSetup';
import { RulesScreen } from './components/rules/RulesScreen';
import { HowToPlay } from './components/rules/HowToPlay';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { RoleReveal } from './components/reveal/RoleReveal';
import { NightPhase } from './components/night/NightPhase';
import { DayAnnouncement } from './components/day/DayAnnouncement';
import { Discussion } from './components/day/Discussion';
import { VotePhase } from './components/vote/VotePhase';
import { VoteResult } from './components/vote/VoteResult';
import { HunterResolution } from './components/vote/HunterResolution';
import { ScapegoatChoice } from './components/vote/ScapegoatChoice';
import { Victory } from './components/victory/Victory';
import { Summary } from './components/summary/Summary';

type MetaView = 'home' | 'setup' | 'rules' | 'howto' | 'settings';

const SPLASH_DURATION_MS = 2600;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      <GameApp />
      {showSplash && <SplashScreen />}
    </>
  );
}

function GameApp() {
  const { state, dispatch, narrator, lastNarrationText, hasResumableGame, resumeSavedGame, resetToHome } = useGame();
  const [metaView, setMetaView] = useState<MetaView>('home');
  const [showSummary, setShowSummary] = useState(false);
  const [inGameSettingsOpen, setInGameSettingsOpen] = useState(false);
  const [homeOptions, setHomeOptions] = useState<GameOptions>(() => loadPreferredOptions());

  const activeOptions = state?.config.options ?? homeOptions;

  useEffect(() => {
    document.body.classList.toggle('no-animations', !activeOptions.animationsEnabled);
    document.body.classList.toggle('high-contrast', activeOptions.highContrast);
  }, [activeOptions.animationsEnabled, activeOptions.highContrast]);

  function updateHomeOptions(patch: Partial<GameOptions>) {
    setHomeOptions((prev) => {
      const next = { ...prev, ...patch };
      savePreferredOptions(next);
      return next;
    });
  }

  function updateGameOptions(patch: Partial<GameOptions>) {
    dispatch({ type: 'UPDATE_OPTIONS', options: patch });
  }

  function goHome() {
    resetToHome();
    setShowSummary(false);
    setInGameSettingsOpen(false);
    setMetaView('home');
  }

  if (!state) {
    if (metaView === 'setup') {
      return (
        <div className="app-shell">
          <NewGameSetup
            onCancel={() => setMetaView('home')}
            onCreate={(config, names) => {
              dispatch({ type: 'NEW_GAME', config: { ...config, options: loadPreferredOptions() }, playerNames: names });
            }}
          />
        </div>
      );
    }
    if (metaView === 'rules') {
      return (
        <div className="app-shell">
          <RulesScreen onBack={() => setMetaView('home')} />
        </div>
      );
    }
    if (metaView === 'howto') {
      return (
        <div className="app-shell">
          <HowToPlay onBack={() => setMetaView('home')} />
        </div>
      );
    }
    if (metaView === 'settings') {
      return (
        <div className="app-shell">
          <SettingsScreen
            options={homeOptions}
            voices={narrator.voices}
            onChange={updateHomeOptions}
            onBack={() => setMetaView('home')}
          />
        </div>
      );
    }
    return (
      <div className="app-shell">
        <HomeScreen
          onNewGame={() => setMetaView('setup')}
          onRules={() => setMetaView('rules')}
          onHowTo={() => setMetaView('howto')}
          onSettings={() => setMetaView('settings')}
          hasSavedGame={hasResumableGame}
          onResume={resumeSavedGame}
        />
      </div>
    );
  }

  if (inGameSettingsOpen) {
    return (
      <div className="app-shell">
        <SettingsScreen
          options={state.config.options}
          voices={narrator.voices}
          onChange={updateGameOptions}
          onBack={() => setInGameSettingsOpen(false)}
        />
      </div>
    );
  }

  if (state.phase === 'GAME_OVER' && showSummary) {
    return (
      <div className="app-shell">
        <Summary
          state={state}
          onNewGame={() => {
            resetToHome();
            setShowSummary(false);
            setMetaView('setup');
          }}
          onHome={goHome}
        />
      </div>
    );
  }

  const headerMenuProps = { onSettings: () => setInGameSettingsOpen(true), onAbandon: goHome };

  return (
    <div className="app-shell">
      {state.phase === 'ROLE_REVEAL' && <RoleReveal state={state} dispatch={dispatch} />}
      {state.phase === 'NIGHT' && (
        <NightPhase
          state={state}
          dispatch={dispatch}
          narrator={narrator}
          lastNarrationText={lastNarrationText}
          onUpdateOptions={updateGameOptions}
        />
      )}
      {state.phase === 'DAY_ANNOUNCEMENT' && (
        <DayAnnouncement
          state={state}
          dispatch={dispatch}
          narrator={narrator}
          lastNarrationText={lastNarrationText}
          onUpdateOptions={updateGameOptions}
          {...headerMenuProps}
        />
      )}
      {state.phase === 'DISCUSSION' && <Discussion state={state} dispatch={dispatch} {...headerMenuProps} />}
      {state.phase === 'VOTE' && <VotePhase state={state} dispatch={dispatch} />}
      {state.phase === 'VOTE_RESULT' && <VoteResult state={state} dispatch={dispatch} {...headerMenuProps} />}
      {state.phase === 'HUNTER_RESOLUTION' && <HunterResolution state={state} dispatch={dispatch} />}
      {state.phase === 'SCAPEGOAT_CHOICE' && <ScapegoatChoice state={state} dispatch={dispatch} />}
      {state.phase === 'GAME_OVER' && (
        <Victory state={state} onSummary={() => setShowSummary(true)} onHome={goHome} />
      )}
    </div>
  );
}
