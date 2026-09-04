export interface PickerOption {
  id: string;
  name: string;
  disabled?: boolean;
  dead?: boolean;
  hint?: string;
}

interface PlayerPickerProps {
  options: PickerOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function PlayerPicker({ options, selectedIds, onToggle }: PlayerPickerProps) {
  return (
    <div className="player-grid" role="group">
      {options.map((option) => {
        const selected = selectedIds.includes(option.id);
        const classes = ['player-tile'];
        if (selected) classes.push('selected');
        if (option.disabled) classes.push('disabled');
        if (option.dead) classes.push('dead');
        return (
          <button
            key={option.id}
            type="button"
            className={classes.join(' ')}
            disabled={option.disabled}
            aria-pressed={selected}
            onClick={() => onToggle(option.id)}
          >
            {option.name}
            {option.hint && (
              <>
                <br />
                <small style={{ opacity: 0.7, fontWeight: 400 }}>{option.hint}</small>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
