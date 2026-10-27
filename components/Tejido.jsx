'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ALTO_UTIL,
  ELECTRODO,
  LIENZO,
  avanzar,
  construirCelulas,
  construirParticulas,
  reubicar,
} from '@/lib/celulas';
import { CORRIENTE } from '@/lib/paletas';
import { hz, num } from '@/lib/cole';

const ANCHO_MINIMO = 640;

export default function Tejido({ tejido, estadoRef, pal }) {
  const ref = useRef(null);
  const cajaRef = useRef(null);
  const [escala, setEscala] = useState(1);
  const celulasRef = useRef([]);
  const particulasRef = useRef([]);
  const datos = useRef({ tejido, pal });
  datos.current = { tejido, pal };

  useEffect(() => {
    celulasRef.current = construirCelulas(tejido.celulas);
    if (particulasRef.current.length === 0) {
      particulasRef.current = construirParticulas();
    }
    reubicar(particulasRef.current);
  }, [tejido]);

  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja) return;
    const medir = () => {
      const w = Math.max(caja.clientWidth, ANCHO_MINIMO);
      if (w > 0) setEscala(w / LIENZO.w);
    };
    const ro = new ResizeObserver(medir);
    ro.observe(caja);
    medir();
    return () => ro.disconnect();
  }, []);

  const dibujar = useCallback(
    (ctx, fraccion, f, fase) => {
      const { tejido: t, pal: p } = datos.current;
      const celulas = celulasRef.current;
      const particulas = particulasRef.current;

      // --- el medio ---
      const g = ctx.createLinearGradient(0, 0, 0, LIENZO.h);
      g.addColorStop(0, p.medioAlto);
      g.addColorStop(1, p.medio);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, LIENZO.w, LIENZO.h);

      // --- las células ---
      const opacidadMembrana = 0.14 + 0.78 * (1 - fraccion);
      for (const c of celulas) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(c.cx, c.cy, c.rx, c.ry, c.giro, 0, Math.PI * 2);
        ctx.fillStyle = p.citoplasma;
        ctx.fill();
        ctx.globalAlpha = opacidadMembrana;
        ctx.strokeStyle = p.membrana;
        ctx.lineWidth = 2.6;
        if (fraccion > 0.45) ctx.setLineDash([5, 4 + 14 * (fraccion - 0.45)]);
        ctx.stroke();
        ctx.restore();
      }

      // --- la corriente ---
      for (const q of particulas) {
        const col = q.cruza ? CORRIENTE.adentro : CORRIENTE.afuera;
        const e = q.estela;
        if (e.length >= 4) {
          ctx.beginPath();
          ctx.moveTo(e[0], e[1]);
          for (let i = 2; i < e.length; i += 2) ctx.lineTo(e[i], e[i + 1]);
          ctx.strokeStyle = col;
          ctx.globalAlpha = 0.34;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(q.x, q.y, 2.9, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }

      // --- los electrodos ---
      for (const [x, signo] of [
        [0, '−'],
        [LIENZO.w - ELECTRODO, '+'],
      ]) {
        const ge = ctx.createLinearGradient(x, 0, x + ELECTRODO, 0);
        ge.addColorStop(0, p.electrodo);
        ge.addColorStop(0.5, p.electrodoAlto);
        ge.addColorStop(1, p.electrodo);
        ctx.fillStyle = ge;
        ctx.fillRect(x, 0, ELECTRODO, LIENZO.h);
        ctx.save();
        ctx.font = '600 20px Arimo, Arial, sans-serif';
        ctx.fillStyle = p.fondo;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(signo, x + ELECTRODO / 2, 26);
        ctx.fillText('∼', x + ELECTRODO / 2, LIENZO.h - 26);
        ctx.restore();
      }

      // --- rótulos ---
      const rotulo = (s, x, y, color, tam = 13, alin = 'left', peso = 400) => {
        ctx.save();
        ctx.font = `${peso} ${tam}px Arimo, Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = alin;
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = p.medio;
        ctx.strokeText(s, x, y);
        ctx.fillText(s, x, y);
        ctx.restore();
      };

      rotulo(t.nombre, ELECTRODO + 16, 24, p.texto, 15, 'left', 700);
      rotulo(hz(f), LIENZO.w - ELECTRODO - 16, 24, p.acento, 17, 'right', 700);

      // --- la barra del reparto de corriente ---
      const bx = ELECTRODO + 16;
      const bw = LIENZO.w - 2 * ELECTRODO - 32;
      const by = ALTO_UTIL + 26;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = CORRIENTE.afuera;
      ctx.fillRect(bx, by, bw * (1 - fraccion), 9);
      ctx.fillStyle = CORRIENTE.adentro;
      ctx.fillRect(bx + bw * (1 - fraccion), by, bw * fraccion, 9);
      ctx.restore();

      rotulo(
        `${num((1 - fraccion) * 100, 1)} % por afuera de las células`,
        bx,
        by - 14,
        CORRIENTE.afuera,
        12.5
      );
      rotulo(
        `${num(fraccion * 100, 1)} % atravesando las membranas`,
        bx + bw,
        by - 14,
        CORRIENTE.adentro,
        12.5,
        'right'
      );
    },
    []
  );

  useEffect(() => {
    let id;
    let ultimo = performance.now();
    const cv = ref.current;
    if (!cv) return;

    function cuadro(ahora) {
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      const e = estadoRef.current || {};
      const fraccion = e.fraccion ?? 0;

      if (e.corriendo !== false) {
        avanzar(particulasRef.current, celulasRef.current, fraccion, dt, 150);
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = LIENZO.w * escala;
      const h = LIENZO.h * escala;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
        cv.style.width = `${w}px`;
        cv.style.height = `${h}px`;
      }
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);
      dibujar(ctx, fraccion, e.f ?? 1e3, e.fase ?? 0);

      id = requestAnimationFrame(cuadro);
    }

    id = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(id);
  }, [escala, dibujar, estadoRef]);

  return (
    <div className="tejido-caja" ref={cajaRef}>
      <canvas ref={ref} aria-label="Corte de tejido con la corriente de medición" />
    </div>
  );
}
