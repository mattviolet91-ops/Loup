interface HowToPlayProps {
  onBack: () => void;
}

const STEPS: { emoji: string; title: string; body: string }[] = [
  {
    emoji: '📱',
    title: 'Un seul téléphone pour tous',
    body: "Posez le téléphone au centre du groupe. L'application joue le rôle du maître du jeu et vous guide du début à la fin.",
  },
  {
    emoji: '🧑‍🤝‍🧑',
    title: 'Créez la partie',
    body: 'Indiquez le nombre de joueurs, leurs prénoms, puis choisissez les rôles à inclure. L\'application vérifie que tout est cohérent.',
  },
  {
    emoji: '🃏',
    title: 'Chacun découvre son rôle',
    body: 'Le téléphone circule : chaque joueur appuie sur "Voir mon rôle", le mémorise seul, puis le cache avant de passer le téléphone au suivant.',
  },
  {
    emoji: '🌙',
    title: 'La nuit, tour par tour',
    body: "Le narrateur réveille chaque rôle dans l'ordre officiel. Seule la personne concernée regarde l'écran ; les autres gardent les yeux fermés.",
  },
  {
    emoji: '☀️',
    title: 'Le jour, tous ensemble',
    body: "Le village découvre les événements de la nuit, débat à voix haute, puis vote à tour de rôle (en secret) pour éliminer un suspect.",
  },
  {
    emoji: '🏆',
    title: "Jusqu'à la victoire",
    body: "La partie s'arrête automatiquement dès qu'un camp remporte la victoire, avec un résumé complet à la fin.",
  },
];

export function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="screen">
      <div className="screen-header">
        <button className="icon-button" onClick={onBack} aria-label="Retour">
          ←
        </button>
        <h1 className="screen-title">Comment jouer</h1>
        <span style={{ width: 40 }} />
      </div>
      <div className="stack">
        {STEPS.map((step) => (
          <div className="card" key={step.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.8rem' }} aria-hidden="true">
              {step.emoji}
            </span>
            <div>
              <h2 style={{ fontSize: '1.05rem' }}>{step.title}</h2>
              <p className="screen-subtitle">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
