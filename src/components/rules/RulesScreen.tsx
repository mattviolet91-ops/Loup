import rulesSource from '../../../RULES.md?raw';
import { renderMarkdown } from '../../utils/markdown';

interface RulesScreenProps {
  onBack: () => void;
}

export function RulesScreen({ onBack }: RulesScreenProps) {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Retour">
          ←
        </button>
        <h1 className="screen-title">Règles du jeu</h1>
        <span style={{ width: 40 }} />
      </div>
      <div className="markdown card" style={{ overflowY: 'auto' }}>
        {renderMarkdown(rulesSource)}
      </div>
    </div>
  );
}
