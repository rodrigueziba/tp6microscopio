/**
 * paletas.js — dos terminaciones para la pieza.
 *
 * Los colores de las partículas y de las curvas no cambian entre paletas: son
 * los del subconjunto Okabe-Ito validado para daltonismo, y cada uno tiene un
 * significado fijo (corriente por afuera / por dentro de la célula).
 */

export const CORRIENTE = {
  afuera: '#0072B2', // por el líquido extracelular
  adentro: '#D55E00', // atravesando las membranas
};

export const PALETAS = [
  {
    id: 'microscopio',
    nombre: 'Microscopio',
    fondo: '#0E1116',
    texto: '#E8E6E1',
    textoTenue: '#9AA2AE',
    superficie: '#171C23',
    borde: '#2A313B',
    acento: '#E6B422',
    // el preparado que se mira
    medio: '#111820',
    medioAlto: '#17202B',
    citoplasma: '#1E2A33',
    membrana: '#5FD2C2',
    electrodo: '#3A424E',
    electrodoAlto: '#C9A227',
    reja: '#1C242D',
    pantalla: '#0B0E12',
    traza: '#8CF2B0',
  },
  {
    id: 'claro',
    nombre: 'Claro (para proyectar)',
    fondo: '#F4F2EC',
    texto: '#1A1D23',
    textoTenue: '#5C6372',
    superficie: '#FFFFFF',
    borde: '#D8D3C8',
    acento: '#9A7A1C',
    medio: '#EDEFF2',
    medioAlto: '#F6F8FA',
    citoplasma: '#DCE6EC',
    membrana: '#1F8E7F',
    electrodo: '#B9B2A4',
    electrodoAlto: '#8A6A12',
    reja: '#E3E6EA',
    pantalla: '#FBFAF7',
    traza: '#136A3C',
  },
];

export const POR_ID = Object.fromEntries(PALETAS.map((p) => [p.id, p]));
export const paleta = (id) => POR_ID[id] || PALETAS[0];

export function aplicarPaleta(id) {
  if (typeof document === 'undefined') return;
  const p = paleta(id);
  const r = document.documentElement.style;
  r.setProperty('--fondo', p.fondo);
  r.setProperty('--texto', p.texto);
  r.setProperty('--texto-tenue', p.textoTenue);
  r.setProperty('--superficie', p.superficie);
  r.setProperty('--borde', p.borde);
  r.setProperty('--acento', p.acento);
  r.setProperty('--afuera', CORRIENTE.afuera);
  r.setProperty('--adentro', CORRIENTE.adentro);
  document.documentElement.dataset.paleta = id;
}
