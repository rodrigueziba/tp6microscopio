/**
 * celulas.js — el tejido que se ve en el microscopio, y la corriente que lo
 * atraviesa.
 *
 * Las células son elipses acomodadas en una grilla con desorden. Entre ellas
 * queda el líquido extracelular, que es por donde la corriente puede circular
 * sin cruzar ninguna membrana.
 *
 * La corriente se dibuja con partículas. A cada partícula se le asigna, una
 * sola vez, un número u entre 0 y 1. En cada cuadro cruza las células si
 *
 *     u < fracción intracelular calculada por el modelo
 *
 * Como los u están repartidos de manera uniforme, la proporción de partículas
 * que cruzan es exactamente la fracción que da el circuito equivalente. Lo
 * que se ve no es una ilustración de la fórmula: es la fórmula, contada en
 * partículas.
 */

export const LIENZO = { w: 1000, h: 520 };
export const ELECTRODO = 36;
// Abajo se reserva una franja para la barra que muestra el reparto de
// corriente, así no se superpone con la última fila de células.
export const FRANJA = 56;
export const ALTO_UTIL = LIENZO.h - FRANJA;

/** Generador pseudoaleatorio con semilla, para que el tejido no cambie solo. */
function dado(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function construirCelulas(cfg, semilla = 20261027) {
  const r = dado(semilla);
  const x0 = ELECTRODO + 18;
  const x1 = LIENZO.w - ELECTRODO - 18;
  const anchoCelda = (x1 - x0) / cfg.columnas;
  const altoCelda = ALTO_UTIL / cfg.filas;

  const celulas = [];
  for (let i = 0; i < cfg.filas; i++) {
    for (let j = 0; j < cfg.columnas; j++) {
      // filas impares corridas media celda: así quedan como un tejido y no
      // como un tablero de ajedrez
      const corrido = i % 2 === 1 ? anchoCelda * 0.5 : 0;
      const cx = x0 + anchoCelda * (j + 0.5) + corrido;
      const cy = altoCelda * (i + 0.5);
      if (cx > x1 + anchoCelda * 0.2) continue;
      celulas.push({
        cx: cx + (r() - 0.5) * anchoCelda * cfg.jitter * 2,
        cy: cy + (r() - 0.5) * altoCelda * cfg.jitter * 2,
        rx: (anchoCelda / 2) * cfg.rx * (0.88 + r() * 0.24),
        ry: (altoCelda / 2) * cfg.ry * (0.88 + r() * 0.24),
        giro: (r() - 0.5) * 0.35,
      });
    }
  }
  return celulas;
}

export function construirParticulas(cantidad = 170, semilla = 991) {
  const r = dado(semilla);
  return Array.from({ length: cantidad }, (_, i) => ({
    // u repartido de manera pareja: la proporción que cruza es exacta
    u: (i + 0.5) / cantidad,
    x: r() * (LIENZO.w - 2 * ELECTRODO) + ELECTRODO,
    carril: 12 + r() * (ALTO_UTIL - 24),
    y: 0,
    vel: 0.82 + r() * 0.36,
    estela: [],
  })).map((p) => ({ ...p, y: p.carril }));
}

/**
 * Empuja un punto fuera de una célula, siguiendo su borde.
 * Devuelve la nueva y, o null si el punto no está adentro.
 */
function esquivar(cel, x, y, margen = 1.06) {
  const dx = (x - cel.cx) / cel.rx;
  if (Math.abs(dx) >= margen) return null;
  const dy = (y - cel.cy) / cel.ry;
  if (dx * dx + dy * dy >= margen * margen) return null;

  const alto = Math.sqrt(Math.max(margen * margen - dx * dx, 0));
  const arriba = cel.cy - alto * cel.ry;
  const abajo = cel.cy + alto * cel.ry;
  return Math.abs(y - arriba) <= Math.abs(y - abajo) ? arriba : abajo;
}

/**
 * Avanza las partículas un paso. `fraccion` es la que da el modelo.
 */
export function avanzar(particulas, celulas, fraccion, dt, velocidad) {
  const paso = velocidad * dt;
  for (const p of particulas) {
    p.cruza = p.u < fraccion;

    p.x += p.vel * paso;
    if (p.x > LIENZO.w - ELECTRODO) {
      p.x = ELECTRODO;
      p.estela.length = 0;
    }

    let y = p.cruza ? p.carril : p.y;
    if (!p.cruza) {
      // tiende a volver a su carril cuando no hay nada que esquivar
      y += (p.carril - y) * Math.min(1, 6 * dt);
      for (const c of celulas) {
        const nueva = esquivar(c, p.x, y);
        if (nueva !== null) {
          y = nueva;
          break;
        }
      }
      y = Math.max(6, Math.min(ALTO_UTIL - 6, y));
    }
    p.y = y;

    p.estela.push(p.x, p.y);
    if (p.estela.length > 16) p.estela.splice(0, p.estela.length - 16);
  }
}

export function reubicar(particulas) {
  for (const p of particulas) {
    p.estela.length = 0;
    p.y = p.carril;
  }
}
