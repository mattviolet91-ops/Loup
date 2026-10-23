// Découpe un MP3 unique contenant les 31 lignes de narration (séparées par des
// silences d'environ 2,5 s) en 31 fichiers nommés selon docs/narration-script.md.
//
//   node scripts/split-narration.mjs <fichier.mp3> [dossier-sortie]
//
// Les « … » à l'intérieur des phrases produisent des pauses courtes (< 1 s) :
// le seuil de 1,2 s ne retient donc que les séparateurs voulus.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIPS = [
  '01-ouverture',
  '02-distribution',
  '03-nuit-premiere',
  '04-nuit-suivante',
  '05-voleur',
  '06-cupidon',
  '07-amoureux',
  '08-salvateur',
  '09-voyante',
  '10-loups',
  '11-petite-fille',
  '12-petite-fille-reperee',
  '13-sorciere',
  '14-sorciere-sans-victime',
  '15-flute',
  '16-jour',
  '17-aucun-mort',
  '18-un-mort',
  '19-plusieurs-morts',
  '20-vote',
  '21-elimination',
  '22-egalite',
  '23-egalite-sans-mort',
  '24-bouc-emissaire',
  '25-idiot',
  '26-ancien',
  '27-chasseur',
  '28-victoire-village',
  '29-victoire-loups',
  '30-victoire-amoureux',
  '31-victoire-flute',
];

const MIN_SILENCE_SECONDS = Number(process.env.MIN_SILENCE ?? 1.2);
const NOISE_FLOOR_DB = Number(process.env.NOISE_FLOOR ?? -40);
/** Marge gardée autour de chaque phrase, pour ne pas rogner les attaques. */
const PADDING_SECONDS = 0.15;

const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error('Usage : node scripts/split-narration.mjs <fichier.mp3> [dossier-sortie]');
  process.exit(1);
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.argv[3] ? resolve(process.argv[3]) : resolve(projectRoot, 'public/audio');
mkdirSync(outDir, { recursive: true });

function duration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return parseFloat(out.toString().trim());
}

/** ffmpeg écrit le rapport de `silencedetect` sur stderr. */
function silenceReport(file) {
  return execFileSync(
    'ffmpeg',
    ['-i', file, '-af', `silencedetect=noise=${NOISE_FLOOR_DB}dB:d=${MIN_SILENCE_SECONDS}`, '-f', 'null', '-'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  ).toString();
}

let report;
try {
  report = silenceReport(input);
} catch (err) {
  report = (err.stderr ?? Buffer.alloc(0)).toString();
}

const starts = [...report.matchAll(/silence_start:\s*(-?[0-9.]+)/g)].map((m) => parseFloat(m[1]));
const ends = [...report.matchAll(/silence_end:\s*(-?[0-9.]+)/g)].map((m) => parseFloat(m[1]));
const total = duration(input);

// Les segments de parole sont les intervalles situés entre deux silences.
const segments = [];
let cursor = 0;
for (let i = 0; i < starts.length; i++) {
  if (starts[i] - cursor > 0.3) segments.push([cursor, starts[i]]);
  cursor = ends[i] ?? starts[i];
}
if (total - cursor > 0.3) segments.push([cursor, total]);

console.log(`Durée totale : ${total.toFixed(2)} s — ${segments.length} segment(s) pour ${CLIPS.length} attendu(s).`);

if (segments.length !== CLIPS.length) {
  console.error(
    `\n⚠️  Nombre de segments inattendu. Ajustez les seuils puis relancez, par exemple :\n` +
      `    MIN_SILENCE=1.5 NOISE_FLOOR=-45 node scripts/split-narration.mjs "${input}"\n`,
  );
  segments.forEach(([s, e], i) => console.error(`  ${i + 1}. ${s.toFixed(2)} → ${e.toFixed(2)} (${(e - s).toFixed(2)} s)`));
  process.exit(2);
}

segments.forEach(([start, end], i) => {
  const from = Math.max(0, start - PADDING_SECONDS);
  const length = Math.min(total, end + PADDING_SECONDS) - from;
  const target = resolve(outDir, `${CLIPS[i]}.mp3`);
  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-i', input,
    '-ss', String(from),
    '-t', String(length),
    '-c:a', 'libmp3lame', '-q:a', '4',
    target,
  ]);
  console.log(`✓ ${CLIPS[i]}.mp3 (${length.toFixed(2)} s)`);
});

console.log(`\n${CLIPS.length} fichiers écrits dans ${outDir}`);
