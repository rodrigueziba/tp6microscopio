/**
 * tejidos.js — los tejidos que se pueden mirar en el microscopio.
 *
 * Los cinco primeros son los de la Tabla 1 del enunciado. Los tres últimos
 * salieron de ajustar el Modelo de Cole a mediciones reales del dataset de
 * Dell'Osa et al. (Zenodo 15795175), en el punto 3 del práctico: están acá
 * para poder comparar los valores de tabla con los que da una medición.
 */

// Paleta Okabe-Ito en el orden validado para daltonismo (separación mínima
// ΔE 11,0 en deuteranopía). El orden es fijo: nunca se recicla ni se reasigna.
export const PALETA = ['#0072B2', '#D55E00', '#009E73', '#E69F00', '#CC79A7'];

export const TEJIDOS = [
  {
    id: 'musculo-long',
    nombre: 'Músculo longitudinal',
    corto: 'Músc. long.',
    fuente: 'Tabla 1',
    color: PALETA[0],
    R0: 385,
    Rinf: 70,
    fc: 37e3,
    alpha: 0.27,
    nota:
      'Medido a lo largo de las fibras. La corriente puede correr por los ' +
      'canales entre fibras sin cruzar casi ninguna membrana.',
    celulas: { filas: 4, columnas: 7, rx: 0.86, ry: 0.42, jitter: 0.06 },
  },
  {
    id: 'musculo-trans',
    nombre: 'Músculo transversal',
    corto: 'Músc. trans.',
    fuente: 'Tabla 1',
    color: PALETA[1],
    R0: 730,
    Rinf: 75,
    fc: 27e3,
    alpha: 0.24,
    nota:
      'El mismo músculo medido cruzando las fibras. Ahora la corriente tiene ' +
      'que atravesarlas, y por eso R₀ casi se duplica.',
    celulas: { filas: 7, columnas: 4, rx: 0.42, ry: 0.86, jitter: 0.06 },
  },
  {
    id: 'higado',
    nombre: 'Hígado',
    corto: 'Hígado',
    fuente: 'Tabla 1',
    color: PALETA[2],
    R0: 540,
    Rinf: 100,
    fc: 72e3,
    alpha: 0.45,
    nota:
      'Células parecidas entre sí y muy juntas. El α más alto que el músculo ' +
      'dice que los tiempos de relajación están menos dispersos.',
    celulas: { filas: 5, columnas: 6, rx: 0.68, ry: 0.62, jitter: 0.1 },
  },
  {
    id: 'pulmon',
    nombre: 'Pulmón',
    corto: 'Pulmón',
    fuente: 'Tabla 1',
    color: PALETA[3],
    R0: 440,
    Rinf: 70,
    fc: 100e3,
    alpha: 0.59,
    nota:
      'El α más alto de los cinco: el tejido se comporta casi como si tuviera ' +
      'un único tiempo de relajación.',
    celulas: { filas: 4, columnas: 5, rx: 0.78, ry: 0.72, jitter: 0.16 },
  },
  {
    id: 'bazo',
    nombre: 'Bazo',
    corto: 'Bazo',
    fuente: 'Tabla 1',
    color: PALETA[4],
    R0: 550,
    Rinf: 60,
    fc: 373e3,
    alpha: 0.36,
    nota:
      'La f_c más alta de la tabla, diez veces la del músculo: sus membranas ' +
      'se vuelven transparentes mucho antes.',
    celulas: { filas: 6, columnas: 7, rx: 0.56, ry: 0.54, jitter: 0.14 },
  },

  // --- ajustados a mediciones reales, punto 3 ---
  {
    id: 'ayllon',
    nombre: 'Humano, SFB7 Impedimed',
    corto: 'Humano (medido)',
    fuente: 'medido · Ayllón 2016 · ID 13',
    color: PALETA[0],
    medido: true,
    R0: 209.83,
    Rinf: 127.1,
    fc: 274.782e3,
    alpha: 0.6011,
    nota:
      'Ajuste sobre 227 puntos de una medición real de bioimpedancia humana. ' +
      'Error 0,82 %, R² = 0,9999.',
    celulas: { filas: 5, columnas: 6, rx: 0.7, ry: 0.6, jitter: 0.13 },
  },
  {
    id: 'delorenzo',
    nombre: 'Humano, DeLorenzo 1997',
    corto: 'Humano (DeLorenzo)',
    fuente: 'medido · DeLorenzo 1997 · ID 1231',
    color: PALETA[1],
    medido: true,
    R0: 570.48,
    Rinf: 342.22,
    fc: 42.688e3,
    alpha: 0.6955,
    nota:
      'Una de las mediciones más viejas de la compilación, con sólo 21 puntos, ' +
      'y aun así el modelo la describe con 1,1 % de error.',
    celulas: { filas: 5, columnas: 5, rx: 0.72, ry: 0.66, jitter: 0.12 },
  },
  {
    id: 'agar',
    nombre: 'Fantoma de agar-agar',
    corto: 'Agar (medido)',
    fuente: 'medido · Dell’Osa 2019 · ID 1380',
    color: PALETA[2],
    medido: true,
    R0: 213.28,
    Rinf: 69.6,
    fc: 4.0,
    alpha: 0.7309,
    nota:
      'No es tejido: es un gel que imita sus propiedades eléctricas. Su f_c ' +
      'cae en unos pocos hertz, cinco órdenes por debajo de un músculo.',
    celulas: { filas: 6, columnas: 8, rx: 0.5, ry: 0.5, jitter: 0.22 },
  },
];

export const POR_ID = Object.fromEntries(TEJIDOS.map((t) => [t.id, t]));

export function instanciar(id) {
  const t = POR_ID[id] || TEJIDOS[0];
  return { ...t, celulas: { ...t.celulas } };
}
