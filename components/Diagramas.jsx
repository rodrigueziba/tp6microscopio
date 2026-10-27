'use client';

import { useEffect, useRef } from 'react';
import { arcoTeorico, hz, impedancia, malla, modulo, num } from '@/lib/cole';

/**
 * Las dos lecturas del instrumento.
 *
 * A la izquierda el diagrama de Cole, que es lo que se grafica en todo
 * trabajo de bioimpedancia: -Im Z contra Re Z, sin el tiempo a la vista. A la
 * derecha el módulo contra la frecuencia. En los dos hay un punto que marca
 * dónde está parada la medición en este momento.
 */
export default function Diagramas({ tejido, estadoRef, pal, rangoF }) {
  const refCole = useRef(null);
  const refBode = useRef(null);
  const datos = useRef({ tejido, pal, rangoF });
  datos.current = { tejido, pal, rangoF };

  useEffect(() => {
    let id;

    function medir(cv) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (!w || !h) return null;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, w, h };
    }

    function rotulo(ctx, s, x, y, color, tam = 11, alin = 'left') {
      ctx.save();
      ctx.font = `${tam}px Arimo, Arial, sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = alin;
      ctx.textBaseline = 'middle';
      ctx.fillText(s, x, y);
      ctx.restore();
    }

    function reja(ctx, w, h, p) {
      ctx.fillStyle = p.pantalla;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = p.reja;
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) {
        const x = (w * i) / 8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        const y = (h * i) / 6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function cole(ctx, w, h, t, p, f) {
      reja(ctx, w, h, p);
      const m = { i: 44, d: 16, s: 26, b: 32 };
      const { R0, Rinf, fc, alpha } = t;
      const a = arcoTeorico(R0, Rinf, alpha);
      const topeY = a.radio + a.cy;
      const x0 = Rinf - (R0 - Rinf) * 0.06;
      const x1 = R0 + (R0 - Rinf) * 0.06;
      const y1 = topeY * 1.22;

      const X = (v) => m.i + ((v - x0) / (x1 - x0)) * (w - m.i - m.d);
      const Y = (v) => h - m.b - (v / y1) * (h - m.s - m.b);

      // eje real
      ctx.strokeStyle = p.textoTenue;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(X(x0), Y(0));
      ctx.lineTo(X(x1), Y(0));
      ctx.stroke();
      ctx.globalAlpha = 1;

      // el arco
      const fs = malla(fc * 1e-7, fc * 1e7, 900);
      ctx.beginPath();
      fs.forEach((ff, i) => {
        const Z = impedancia(ff, R0, Rinf, fc, alpha);
        const px = X(Z.re);
        const py = Y(-Z.im);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // R0, Rinf y el vértice
      for (const [v, et] of [
        [Rinf, 'R∞'],
        [R0, 'R₀'],
      ]) {
        ctx.beginPath();
        ctx.moveTo(X(v), Y(0) - 5);
        ctx.lineTo(X(v), Y(0) + 5);
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        rotulo(ctx, `${et} ${num(v, 0)}`, X(v), Y(0) + 16, p.textoTenue, 10.5, v === Rinf ? 'left' : 'right');
      }

      // dónde está la medición ahora
      const Z = impedancia(f, R0, Rinf, fc, alpha);
      const px = X(Z.re);
      const py = Y(-Z.im);
      ctx.beginPath();
      ctx.moveTo(px, Y(0));
      ctx.lineTo(px, py);
      ctx.strokeStyle = p.acento;
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.acento;
      ctx.fill();
      ctx.strokeStyle = p.pantalla;
      ctx.lineWidth = 2;
      ctx.stroke();

      rotulo(ctx, '−Im Z [Ω]  contra  Re Z [Ω]', m.i, m.s - 6, p.textoTenue, 10.5);
    }

    function bode(ctx, w, h, t, p, f, rango) {
      reja(ctx, w, h, p);
      const m = { i: 48, d: 16, s: 26, b: 32 };
      const { R0, Rinf, fc, alpha } = t;
      const [fa, fb] = rango;
      const X = (v) =>
        m.i + ((Math.log10(v) - Math.log10(fa)) / (Math.log10(fb) - Math.log10(fa))) * (w - m.i - m.d);
      const yMax = R0 * 1.06;
      const yMin = Rinf * 0.9;
      const Y = (v) => h - m.b - ((v - yMin) / (yMax - yMin)) * (h - m.s - m.b);

      const fs = malla(fa, fb, 500);
      ctx.beginPath();
      fs.forEach((ff, i) => {
        const px = X(ff);
        const py = Y(modulo(impedancia(ff, R0, Rinf, fc, alpha)));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // la frecuencia central
      if (fc >= fa && fc <= fb) {
        ctx.beginPath();
        ctx.moveTo(X(fc), m.s);
        ctx.lineTo(X(fc), h - m.b);
        ctx.strokeStyle = p.textoTenue;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        rotulo(ctx, 'f_c', X(fc) + 5, m.s + 8, p.textoTenue, 10.5);
      }

      const Z = impedancia(f, R0, Rinf, fc, alpha);
      ctx.beginPath();
      ctx.arc(X(f), Y(modulo(Z)), 6, 0, Math.PI * 2);
      ctx.fillStyle = p.acento;
      ctx.fill();
      ctx.strokeStyle = p.pantalla;
      ctx.lineWidth = 2;
      ctx.stroke();

      rotulo(ctx, num(yMax, 0), m.i - 6, Y(yMax), p.textoTenue, 10, 'right');
      rotulo(ctx, num(yMin, 0), m.i - 6, Y(yMin), p.textoTenue, 10, 'right');
      rotulo(ctx, hz(fa), m.i, h - 12, p.textoTenue, 10);
      rotulo(ctx, hz(fb), w - m.d, h - 12, p.textoTenue, 10, 'right');
      rotulo(ctx, '|Z| [Ω]  contra  frecuencia', m.i, m.s - 6, p.textoTenue, 10.5);
    }

    function cuadro() {
      const { tejido: t, pal: p, rangoF: rango } = datos.current;
      const f = estadoRef.current?.f ?? 1e3;
      const a = refCole.current && medir(refCole.current);
      if (a) cole(a.ctx, a.w, a.h, t, p, f);
      const b = refBode.current && medir(refBode.current);
      if (b) bode(b.ctx, b.w, b.h, t, p, f, rango);
      id = requestAnimationFrame(cuadro);
    }

    id = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(id);
  }, [estadoRef]);

  return (
    <div className="diagramas">
      <figure className="pantalla">
        <figcaption>diagrama de Cole</figcaption>
        <canvas ref={refCole} />
      </figure>
      <figure className="pantalla">
        <figcaption>módulo contra frecuencia</figcaption>
        <canvas ref={refBode} />
      </figure>
    </div>
  );
}
