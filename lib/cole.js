/**
 * cole.js — el Modelo de Cole y su circuito equivalente.
 *
 *     Z(w) = R_inf + (R0 - R_inf) / (1 + (j·w·tau)^alpha)
 *
 * con w = 2·pi·f y tau = 1/(2·pi·fc).
 *
 * La potencia compleja se escribe a mano, porque JavaScript no tiene números
 * complejos. Para x > 0 y usando la rama principal:
 *
 *     (j·x)^alpha = x^alpha · ( cos(alpha·pi/2) + j·sen(alpha·pi/2) )
 *
 * ---------------------------------------------------------------------------
 * EL CIRCUITO EQUIVALENTE — de dónde sale la animación
 *
 * El Modelo de Cole no es una curva inventada: es exactamente la impedancia
 * de dos caminos en paralelo.
 *
 *     Re  ──────────────────────────   el líquido de afuera de las células
 *      │                           │
 *      ├──  Ri ── CPE(Q, alpha) ───┤   el interior de la célula, en serie
 *                                      con su membrana
 *
 * Igualando término a término con la fórmula de Cole sale, sin aproximar:
 *
 *     Re = R0                          en continua sólo conduce el camino de afuera
 *     Ri = R0·R_inf / (R0 - R_inf)     el interior de la célula
 *     Q  = tau^alpha · (R0 - R_inf) / R0²
 *
 * Y de ahí sale la cantidad que la pieza dibuja: qué fracción de la corriente
 * total pasa POR DENTRO de las células a cada frecuencia. No es un adorno, es
 * el reparto de corriente entre las dos ramas del circuito.
 */

export const TAU = (fc) => 1 / (2 * Math.PI * fc);

/** Impedancia compleja a la frecuencia f [Hz]. Devuelve {re, im}. */
export function impedancia(f, R0, Rinf, fc, alpha) {
  const w = 2 * Math.PI * f;
  const x = Math.pow(Math.max(w * TAU(fc), 0), alpha); // módulo de (jwtau)^alpha
  const th = (alpha * Math.PI) / 2;
  const a = 1 + x * Math.cos(th); // parte real de 1 + (jwtau)^alpha
  const b = x * Math.sin(th); // parte imaginaria
  const d = a * a + b * b;
  const dR = R0 - Rinf;
  return { re: Rinf + (dR * a) / d, im: (-dR * b) / d };
}

export const modulo = (Z) => Math.hypot(Z.re, Z.im);
export const fase = (Z) => Math.atan2(Z.im, Z.re);

/**
 * Los tres valores del circuito equivalente, deducidos de los cuatro
 * parámetros de Cole.
 */
export function circuito(R0, Rinf, fc, alpha) {
  const dR = R0 - Rinf;
  const Rext = R0;
  const Rint = dR > 1e-9 ? (R0 * Rinf) / dR : Infinity;
  const Q = (Math.pow(TAU(fc), alpha) * dR) / (R0 * R0);
  return { Rext, Rint, Q };
}

/**
 * Fracción del total de corriente que circula por el interior de las células
 * a la frecuencia f. Vale 0 en continua y tiende a R0/(R0+Ri) en alta
 * frecuencia.
 *
 * Y_ext = 1/Re  ·  Y_int = 1/(Ri + Z_CPE)  ·  fracción = |Y_int| / |Y_ext + Y_int|
 */
export function fraccionIntracelular(f, R0, Rinf, fc, alpha) {
  const { Rext, Rint, Q } = circuito(R0, Rinf, fc, alpha);
  if (!isFinite(Rint)) return 0;
  const w = 2 * Math.PI * f;
  if (w <= 0) return 0;

  // Z_CPE = 1/(Q·(jw)^alpha) = (1/Q)·w^-alpha · (cos(-th) + j·sen(-th))
  const th = (alpha * Math.PI) / 2;
  const m = 1 / (Q * Math.pow(w, alpha));
  const zr = Rint + m * Math.cos(th);
  const zi = -m * Math.sin(th);

  const d = zr * zr + zi * zi; // Y_int = (zr - j·zi)/|z|²
  const yr = zr / d;
  const yi = -zi / d;

  const sr = 1 / Rext + yr;
  const si = yi;
  return Math.hypot(yr, yi) / Math.hypot(sr, si);
}

/** Centro y radio del arco en el plano (Re Z, -Im Z), y ángulo de depresión. */
export function arcoTeorico(R0, Rinf, alpha) {
  const dR = R0 - Rinf;
  const th = ((1 - alpha) * Math.PI) / 2;
  return {
    cx: (R0 + Rinf) / 2,
    cy: -(dR / 2) * Math.tan(th),
    radio: dR / 2 / Math.cos(th),
    depresion: th,
  };
}

/** Valores notables que la pieza muestra en pantalla. */
export function notables(R0, Rinf, fc, alpha) {
  const dR = R0 - Rinf;
  const { Rext, Rint } = circuito(R0, Rinf, fc, alpha);
  return {
    dR,
    tau: TAU(fc),
    // en fc el arco está en su vértice, y los dos valores salen exactos
    reEnFc: (R0 + Rinf) / 2,
    imEnFc: (dR / 2) * Math.tan((alpha * Math.PI) / 4),
    Rext,
    Rint,
    // techo de la fracción intracelular, cuando la membrana ya no frena nada
    fraccionMaxima: isFinite(Rint) ? R0 / (R0 + Rint) : 0,
    ...arcoTeorico(R0, Rinf, alpha),
  };
}

/** Frecuencias espaciadas en escala logarítmica. */
export function malla(fMin, fMax, n) {
  const a = Math.log10(fMin);
  const b = Math.log10(fMax);
  return Array.from({ length: n }, (_, i) =>
    Math.pow(10, a + ((b - a) * i) / (n - 1))
  );
}

/** Formato argentino: coma decimal y menos tipográfico. */
export function num(v, dec = 2) {
  if (!isFinite(v)) return '—';
  let s = v.toFixed(dec);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',').replace('-', '−');
}

/** Frecuencia en la unidad que corresponda. */
export function hz(f) {
  if (f >= 1e6) return `${num(f / 1e6, 2)} MHz`;
  if (f >= 1e3) return `${num(f / 1e3, 2)} kHz`;
  return `${num(f, 1)} Hz`;
}
