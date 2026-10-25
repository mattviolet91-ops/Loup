// Découpe un enregistrement unique des 31 lignes de narration en 31 fichiers
// nommés selon scripts/narration-lines.json.
//
//   node scripts/split-narration.mjs <fichier.mp3> [dossier-sortie]
//
// Pourquoi pas un simple découpage sur les silences : les voix de synthèse
// gardent une réverbération qui empêche le niveau de redescendre entre les
// phrases, et les balises de pause ne sont pas toujours respectées. Sur un
// enregistrement réel, `silencedetect` trouvait 56 pauses de longueur
// indiscernable pour 31 lignes, et aucune sur deux passages de 10 et 14 s.
//
// La méthode retenue ne dépend donc pas de silences absolus :
//   1. enveloppe d'énergie RMS en trames de 20 ms ;
//   2. points de coupe candidats = minima locaux de cette enveloppe ;
//   3. programmation dynamique : répartir les 31 lignes sur ces candidats en
//      rapprochant au mieux la durée de chaque ligne de celle attendue d'après
//      son nombre de caractères, tout en préférant les creux les plus profonds.
//
// Le script vérifie ensuite son propre résultat de deux façons indépendantes
// (voir `verifier`) et refuse d'écrire si la qualité est insuffisante.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 16000;
/** 20 ms : assez court pour voir une respiration, assez long pour lisser le bruit. */
const FRAME = 320;
const FRAME_SECONDS = FRAME / SAMPLE_RATE;
/** Poids du « creux » d'un point de coupe face à l'écart de durée. */
const CUT_DEPTH_WEIGHT = Number(process.env.CUT_DEPTH_WEIGHT ?? 0.35);
/** Écart de durée au-delà duquel on considère l'alignement raté. */
const MAX_DEVIATION = Number(process.env.MAX_DEVIATION ?? 0.35);

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LINES = JSON.parse(readFileSync(resolve(projectRoot, 'scripts/narration-lines.json'), 'utf8'));

const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error('Usage : node scripts/split-narration.mjs <fichier.mp3> [dossier-sortie]');
  process.exit(1);
}
const outDir = process.argv[3] ? resolve(process.argv[3]) : resolve(projectRoot, 'public/audio');

/** Longueur du texte réellement prononcé, qui donne la durée attendue. */
const spokenLength = (text) => text.replace(/\s+/g, ' ').trim().length;

function enveloppe(file) {
  const pcm = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SAMPLE_RATE), '-f', 's16le', '-'],
    { maxBuffer: 1 << 28 },
  ).stdout;
  if (!pcm?.length) {
    console.error("Impossible de décoder l'audio. ffmpeg est-il installé ?");
    process.exit(1);
  }
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const count = Math.floor(samples.length / FRAME);
  const raw = new Float64Array(count);
  for (let f = 0; f < count; f++) {
    let energy = 0;
    for (let i = f * FRAME; i < (f + 1) * FRAME; i++) {
      const v = samples[i] / 32768;
      energy += v * v;
    }
    raw[f] = 20 * Math.log10(Math.sqrt(energy / FRAME) + 1e-9);
  }
  // Moyenne sur trois trames : retire le bruit trame-à-trame sans combler les creux.
  const smooth = new Float64Array(count);
  for (let f = 0; f < count; f++) {
    const from = Math.max(0, f - 1);
    const to = Math.min(count - 1, f + 1);
    let sum = 0;
    for (let k = from; k <= to; k++) sum += raw[k];
    smooth[f] = sum / (to - from + 1);
  }
  return smooth;
}

/** Minima locaux de l'enveloppe, candidats à devenir une fin de ligne. */
function pointsDeCoupe(env, median) {
  const WINDOW = 6; // 120 ms de part et d'autre
  const minima = [];
  for (let f = WINDOW; f < env.length - WINDOW; f++) {
    if (env[f] > median) continue;
    let isMin = true;
    for (let k = f - WINDOW; k <= f + WINDOW; k++) {
      if (env[k] < env[f]) {
        isMin = false;
        break;
      }
    }
    if (isMin) minima.push(f);
  }
  const cuts = [0];
  for (const f of minima) if (f - cuts[cuts.length - 1] >= 8) cuts.push(f);
  if (cuts[cuts.length - 1] !== env.length) cuts.push(env.length);
  return cuts;
}

/**
 * Répartit les lignes sur les points de coupe candidats.
 * dp[j][b] = coût minimal pour placer les j premières lignes sur les b premiers candidats.
 */
function aligner(cuts, depth, lengths, rate) {
  const n = lengths.length;
  const c = cuts.length;
  const dp = Array.from({ length: n + 1 }, () => new Float64Array(c).fill(Infinity));
  const from = Array.from({ length: n + 1 }, () => new Int32Array(c).fill(-1));
  dp[0][0] = 0;
  for (let j = 1; j <= n; j++) {
    const expected = lengths[j - 1] * rate;
    for (let b = j; b < c - (n - j); b++) {
      const end = cuts[b] * FRAME_SECONDS;
      for (let a = j - 1; a < b; a++) {
        if (dp[j - 1][a] === Infinity) continue;
        const duration = end - cuts[a] * FRAME_SECONDS;
        if (duration <= 0.4) continue;
        const deviation = (duration - expected) / expected;
        // La dernière coupe est la fin du fichier : sa profondeur n'est pas un choix.
        const penalty = j < n ? CUT_DEPTH_WEIGHT * depth[b] : 0;
        const cost = dp[j - 1][a] + deviation * deviation + penalty;
        if (cost < dp[j][b]) {
          dp[j][b] = cost;
          from[j][b] = a;
        }
      }
    }
  }
  const index = new Array(n + 1);
  index[n] = c - 1;
  for (let j = n; j >= 1; j--) index[j - 1] = from[j][index[j]];
  return index.some((v) => v < 0) ? null : index;
}

/**
 * Deux contrôles que l'alignement n'a pas utilisés, donc capables de le démentir :
 * les coupes doivent tomber dans les pauses que `silencedetect` trouve de son
 * côté, et la pause interne d'une ligne doit se situer là où son texte porte
 * un « … ».
 */
function verifier(file, segments) {
  const report =
    spawnSync('ffmpeg', ['-i', file, '-af', 'silencedetect=noise=-40dB:d=0.40', '-f', 'null', '-'], {
      encoding: 'utf8',
    }).stderr ?? '';
  const starts = [...report.matchAll(/silence_start:\s*([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  const ends = [...report.matchAll(/silence_end:\s*([0-9.]+)/g)].map((m) => parseFloat(m[1]));
  const silences = starts.map((s, i) => [s, ends[i] ?? s]);

  const cuts = segments.slice(1).map((s) => s.start);
  const inSilence = cuts.filter((c) => silences.some(([a, b]) => c >= a && c <= b)).length;

  let checked = 0;
  let agreeing = 0;
  for (const seg of segments) {
    const at = seg.text.indexOf('…');
    if (at < 0) continue;
    const inner = silences
      .map(([a, b]) => (a + b) / 2)
      .filter((m) => m > seg.start + 0.25 && m < seg.end - 0.25);
    if (inner.length !== 1) continue;
    checked++;
    const expected = at / seg.text.length;
    const actual = (inner[0] - seg.start) / (seg.end - seg.start);
    if (Math.abs(actual - expected) <= 0.1) agreeing++;
  }
  return { cuts: cuts.length, inSilence, checked, agreeing };
}

const env = enveloppe(input);
const sorted = [...env].sort((a, b) => a - b);
const quantile = (p) => sorted[Math.floor(p * (sorted.length - 1))];
const loud = quantile(0.95);
const quiet = quantile(0.02);
const total = env.length * FRAME_SECONDS;

const cuts = pointsDeCoupe(env, quantile(0.5));
// 0 = creux marqué (bon endroit pour couper), 1 = plein volume (mauvais).
const depth = cuts.map((f) => {
  const level = f === 0 || f === env.length ? quiet : env[f];
  return Math.min(1, Math.max(0, (level - quiet) / (loud - quiet)));
});

const lengths = LINES.map((l) => spokenLength(l.text));
const totalLength = lengths.reduce((a, b) => a + b, 0);

console.log(
  `${total.toFixed(1)} s d'audio, ${LINES.length} lignes attendues, ` +
    `${cuts.length} points de coupe candidats.`,
);

// Le débit se déduit du résultat : on itère jusqu'à ce qu'il se stabilise.
let rate = total / totalLength;
let segments = null;
for (let iteration = 0; iteration < 8; iteration++) {
  const index = aligner(cuts, depth, lengths, rate);
  if (!index) {
    console.error("\n⚠️  Aucun alignement possible : l'enregistrement ne contient pas 31 lignes ?");
    process.exit(2);
  }
  segments = LINES.map((line, j) => ({
    ...line,
    start: cuts[index[j]] * FRAME_SECONDS,
    end: cuts[index[j + 1]] * FRAME_SECONDS,
  }));
  const next = segments.reduce((s, g) => s + (g.end - g.start), 0) / totalLength;
  if (Math.abs(next - rate) < 1e-6) break;
  rate = next;
}

let worst = 0;
for (const seg of segments) {
  const expected = spokenLength(seg.text) * rate;
  const deviation = ((seg.end - seg.start) - expected) / expected;
  seg.deviation = deviation;
  if (Math.abs(deviation) > Math.abs(worst)) worst = deviation;
}

const checks = verifier(input, segments);
console.log(
  `Débit ${(rate * 1000).toFixed(0)} ms/caractère, écart de durée maximal ` +
    `${(worst * 100).toFixed(0)} %.`,
);
console.log(
  `Contrôles indépendants : ${checks.inSilence}/${checks.cuts} coupes dans une pause détectée, ` +
    `${checks.agreeing}/${checks.checked} « … » à la bonne place.`,
);

if (Math.abs(worst) > MAX_DEVIATION) {
  console.error(
    `\n⚠️  Écart de durée trop grand (${(worst * 100).toFixed(0)} %) : rien n'a été écrit.\n` +
      `   L'enregistrement doit contenir les ${LINES.length} lignes de ` +
      `scripts/narration-lines.json, dans l'ordre, séparées par une pause nette.\n` +
      `   Pour forcer malgré tout : MAX_DEVIATION=1 node scripts/split-narration.mjs "${input}"\n`,
  );
  for (const seg of segments) {
    console.error(
      `  ${seg.clip.padEnd(24)} ${seg.start.toFixed(2).padStart(7)} → ${seg.end.toFixed(2).padStart(7)} s ` +
        `(${(seg.deviation * 100).toFixed(0)} %)`,
    );
  }
  process.exit(2);
}

mkdirSync(outDir, { recursive: true });
for (const seg of segments) {
  const target = resolve(outDir, `${seg.clip}.mp3`);
  execFileSync('ffmpeg', [
    '-y', '-v', 'error',
    '-i', input,
    '-ss', String(seg.start),
    '-t', String(seg.end - seg.start),
    '-c:a', 'libmp3lame', '-q:a', '4',
    target,
  ]);
  console.log(
    `✓ ${seg.clip}.mp3  ${(seg.end - seg.start).toFixed(2)} s  (${(seg.deviation * 100).toFixed(0)} %)`,
  );
}

console.log(`\n${segments.length} fichiers écrits dans ${outDir}`);
