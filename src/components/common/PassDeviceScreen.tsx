import { Button } from './Button';

interface PassDeviceScreenProps {
  toName: string;
  message?: string;
  emoji?: string;
  onContinue: () => void;
}

export function PassDeviceScreen({ toName, message, emoji = '📱', onContinue }: PassDeviceScreenProps) {
  return (
    <div className="pass-device">
      <span style={{ fontSize: '3.4rem' }} aria-hidden="true">
        {emoji}
      </span>
      <div>
        <h2 className="screen-title">Passe le téléphone à {toName}</h2>
        {message && <p className="screen-subtitle">{message}</p>}
      </div>
      <Button variant="primary" onClick={onContinue} autoFocus>
        C'est bon, je l'ai en main
      </Button>
    </div>
  );
}
