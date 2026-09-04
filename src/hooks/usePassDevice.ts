import { useEffect, useState } from 'react';

/**
 * Gère l'écran interstitiel "Passe le téléphone à X" affiché avant toute
 * information secrète : se réinitialise automatiquement dès que la personne
 * concernée change (nouvel acteur de nuit, joueur suivant au vote...).
 */
export function usePassDevice(actorKey: string | null) {
  const [handedOver, setHandedOver] = useState(false);

  useEffect(() => {
    setHandedOver(false);
  }, [actorKey]);

  return { handedOver, confirm: () => setHandedOver(true) };
}
