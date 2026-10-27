/**
 * Contrasta el motor del microscopio contra la resolución del práctico.
 *
 * Importa: el modelo está escrito dos veces, una en Python (la resolución del
 * TP) y otra en JavaScript (esta pieza). Si las dos dan lo mismo hasta la
 * precisión de la máquina, la pieza no está ilustrando la resolución: la está
 * ejecutando.
 *
 *   npm run verificar
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  arcoTeorico,
  circuito,
  fraccionIntracelular,
  impedancia,
  notables,
} from '../lib/cole.js';
import { TEJIDOS } from '../lib/tejidos.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const REF = JSON.parse(readFileSync(join(aqui, 'referencia.json'), 'utf8'));

let fallas = 0;

function chequear(etiqueta, obtenido, esperado, tol) {
  const ok = Math.abs(obtenido - esperado) <= tol;
  if (!ok) fallas++;
  console.log(
    `  ${ok ? 'OK  ' : 'FALLA'} ${etiqueta.padEnd(48)}` +
      `${obtenido.toPrecision(10).padStart(16)}  esperado ${esperado.toPrecision(10)}`
  );
}

function titulo(t) {
  console.log('\n' + '='.repeat(92));
  console.log(t);
  console.log('='.repeat(92));
}

/* ================================================================== */
titulo('1. El modelo en JavaScript contra el modelo en Python');
/* ================================================================== */

for (const [id, r] of Object.entries(REF)) {
  const [R0, Rinf, fc, alpha] = r.params;
  let peorRe = 0;
  let peorIm = 0;
  for (let i = 0; i < r.f.length; i++) {
    const Z = impedancia(r.f[i], R0, Rinf, fc, alpha);
    peorRe = Math.max(peorRe, Math.abs(Z.re - r.re[i]));
    peorIm = Math.max(peorIm, Math.abs(Z.im - r.im[i]));
  }
  console.log(`\n--- ${id} ---`);
  chequear('máxima diferencia en Re Z sobre 25 frecuencias', peorRe, 0, 1e-9);
  chequear('máxima diferencia en Im Z sobre 25 frecuencias', peorIm, 0, 1e-9);
}

/* ================================================================== */
titulo('2. Los límites y el punto de frecuencia central');
/* ================================================================== */

for (const t of TEJIDOS) {
  const { R0, Rinf, fc, alpha } = t;
  console.log(`\n--- ${t.corto} ---`);
  const baja = impedancia(fc * 1e-30, R0, Rinf, fc, alpha);
  const alta = impedancia(fc * 1e30, R0, Rinf, fc, alpha);
  chequear('Re Z con f → 0 (debe dar R₀)', baja.re, R0, 1e-2);
  chequear('Re Z con f → ∞ (debe dar R∞)', alta.re, Rinf, 1e-2);

  const Zc = impedancia(fc, R0, Rinf, fc, alpha);
  const n = notables(R0, Rinf, fc, alpha);
  chequear('Re Z en f_c = (R₀+R∞)/2', Zc.re, n.reEnFc, 1e-9 * R0);
  chequear('−Im Z en f_c = (ΔR/2)·tan(απ/4)', -Zc.im, n.imEnFc, 1e-9 * R0);
}

/* ================================================================== */
titulo('3. La geometría del arco, contra la que calculó Python');
/* ================================================================== */

for (const [id, r] of Object.entries(REF)) {
  const [R0, Rinf, , alpha] = r.params;
  const a = arcoTeorico(R0, Rinf, alpha);
  console.log(`\n--- ${id} ---`);
  chequear('centro en x', a.cx, r.arco.cx, 1e-9 * Math.abs(r.arco.cx));
  chequear('centro en y', a.cy, r.arco.cy, 1e-9 * Math.abs(r.arco.cy) + 1e-12);
  chequear('radio', a.radio, r.arco.radio, 1e-9 * r.arco.radio);
  chequear('ángulo de depresión', a.depresion, r.arco.depresion, 1e-12);
}

/* ================================================================== */
titulo('4. El circuito equivalente da exactamente la misma impedancia');
/* ================================================================== */

console.log(`
  Esto es lo que justifica la animación. Si Re ∥ (Ri + CPE) no diera
  exactamente lo mismo que la fórmula de Cole, el reparto de corriente que
  dibuja la pieza sería una invención. Se comprueba calculando la impedancia
  del circuito a mano y comparándola con la del modelo.
`);

function impedanciaDelCircuito(f, R0, Rinf, fc, alpha) {
  const { Rext, Rint, Q } = circuito(R0, Rinf, fc, alpha);
  const w = 2 * Math.PI * f;
  const th = (alpha * Math.PI) / 2;
  const m = 1 / (Q * Math.pow(w, alpha)); // |Z_CPE|
  const zr = Rint + m * Math.cos(th); // rama interior: Ri + CPE
  const zi = -m * Math.sin(th);
  // paralelo: Z = Rext·Zi / (Rext + Zi)
  const nr = Rext * zr;
  const ni = Rext * zi;
  const dr = Rext + zr;
  const di = zi;
  const d = dr * dr + di * di;
  return { re: (nr * dr + ni * di) / d, im: (ni * dr - nr * di) / d };
}

for (const t of TEJIDOS) {
  const { R0, Rinf, fc, alpha } = t;
  let peor = 0;
  for (let k = -6; k <= 6; k += 0.25) {
    const f = fc * Math.pow(10, k);
    const a = impedancia(f, R0, Rinf, fc, alpha);
    const b = impedanciaDelCircuito(f, R0, Rinf, fc, alpha);
    peor = Math.max(peor, Math.hypot(a.re - b.re, a.im - b.im));
  }
  chequear(`${t.corto}: Cole contra Re ∥ (Ri + CPE)`, peor, 0, 1e-9 * R0);
}

/* ================================================================== */
titulo('5. El reparto de corriente entre los dos caminos');
/* ================================================================== */

console.log(`
  En continua toda la corriente tiene que ir por afuera de las células: la
  membrana es un aislante. En frecuencia muy alta la membrana deja de frenar
  y el reparto queda fijado por las dos resistencias en paralelo, o sea
  R0/(R0+Ri). Son los dos extremos de lo que dibuja la animación.
`);

for (const t of TEJIDOS) {
  const { R0, Rinf, fc, alpha } = t;
  const n = notables(R0, Rinf, fc, alpha);
  console.log(`\n--- ${t.corto} ---`);
  chequear('fracción intracelular en continua', fraccionIntracelular(fc * 1e-40, R0, Rinf, fc, alpha), 0, 1e-6);
  chequear(
    'fracción en alta frecuencia = R₀/(R₀+Ri)',
    fraccionIntracelular(fc * 1e40, R0, Rinf, fc, alpha),
    n.fraccionMaxima,
    1e-6
  );
  // y tiene que crecer siempre: nunca puede volver atrás al subir la frecuencia
  let monotona = true;
  let previo = -1;
  for (let k = -8; k <= 8; k += 0.1) {
    const v = fraccionIntracelular(fc * Math.pow(10, k), R0, Rinf, fc, alpha);
    if (v < previo - 1e-12) monotona = false;
    previo = v;
  }
  chequear('crece siempre al subir la frecuencia', monotona ? 1 : 0, 1, 0);
  console.log(
    `       Ri = ${n.Rint.toFixed(1)} Ω · tope de corriente por dentro = ` +
      `${(n.fraccionMaxima * 100).toFixed(1)} % · en f_c = ` +
      `${(fraccionIntracelular(fc, R0, Rinf, fc, alpha) * 100).toFixed(1)} %`
  );
}

console.log('\n' + '='.repeat(92));
if (fallas === 0) {
  console.log('Todo cerró. El motor del microscopio y la resolución en Python dan lo mismo.');
} else {
  console.log(`${fallas} comprobación(es) fallaron.`);
  process.exitCode = 1;
}
console.log('='.repeat(92));
