'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Controles from './Controles';
import Diagramas from './Diagramas';
import Intro from './Intro';
import Lectura from './Lectura';
import Tejido from './Tejido';
import { fase as faseDe, fraccionIntracelular, impedancia, notables } from '@/lib/cole';
import { AudioMedicion } from '@/lib/audio';
import { aplicarPaleta, paleta } from '@/lib/paletas';
import { TEJIDOS, instanciar } from '@/lib/tejidos';

const F_MIN = 1;
const F_MAX = 1e8;
const SEGUNDOS_BARRIDO = 16;

const aLog = (f) =>
  (Math.log10(f) - Math.log10(F_MIN)) / (Math.log10(F_MAX) - Math.log10(F_MIN));
const deLog = (u) =>
  Math.pow(10, Math.log10(F_MIN) + u * (Math.log10(F_MAX) - Math.log10(F_MIN)));

export default function Microscopio() {
  const [tejidoId, setTejidoId] = useState('musculo-long');
  const [tejido, setTejido] = useState(() => instanciar('musculo-long'));
  const [u, setU] = useState(() => aLog(37e3));
  const [barriendo, setBarriendo] = useState(true);
  const [paletaId, setPaletaId] = useState('microscopio');
  const [sonido, setSonido] = useState(false);
  const [intro, setIntro] = useState(true);
  const [lectura, setLectura] = useState(null);

  const pal = useMemo(() => paleta(paletaId), [paletaId]);
  const estadoRef = useRef({ f: 37e3, fraccion: 0, fase: 0, corriendo: true });
  const tejidoRef = useRef(tejido);
  const uRef = useRef(u);
  const barriendoRef = useRef(barriendo);
  const sentidoRef = useRef(1);
  const audioRef = useRef(null);
  const sonidoRef = useRef(false);

  tejidoRef.current = tejido;
  uRef.current = u;
  barriendoRef.current = barriendo;

  useEffect(() => aplicarPaleta(paletaId), [paletaId]);

  const cargar = useCallback((id) => {
    const t = instanciar(id);
    setTejidoId(id);
    setTejido(t);
    setU(aLog(Math.min(Math.max(t.fc, F_MIN), F_MAX)));
  }, []);

  /* --------------------------- el bucle --------------------------- */

  useEffect(() => {
    let id;
    let ultimo = performance.now();
    let ultimoReporte = 0;

    function cuadro(ahora) {
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      const t = tejidoRef.current;

      let uu = uRef.current;
      if (barriendoRef.current) {
        uu += (sentidoRef.current * dt) / SEGUNDOS_BARRIDO;
        if (uu >= 1) {
          uu = 1;
          sentidoRef.current = -1;
        } else if (uu <= 0) {
          uu = 0;
          sentidoRef.current = 1;
        }
        uRef.current = uu;
      }

      const f = deLog(uu);
      const Z = impedancia(f, t.R0, t.Rinf, t.fc, t.alpha);
      const fr = fraccionIntracelular(f, t.R0, t.Rinf, t.fc, t.alpha);
      const ph = faseDe(Z);
      estadoRef.current = { f, fraccion: fr, fase: ph, corriendo: true };

      if (sonidoRef.current) audioRef.current?.actualizar({ f, fase: ph });

      if (ahora - ultimoReporte > 90) {
        ultimoReporte = ahora;
        if (barriendoRef.current) setU(uu);
        setLectura({ f, Z, fraccion: fr, fase: ph });
      }
      id = requestAnimationFrame(cuadro);
    }

    id = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(id);
  }, []);

  /* --------------------------- sonido --------------------------- */

  async function alternarSonido() {
    if (!audioRef.current) audioRef.current = new AudioMedicion();
    if (!sonido) {
      const ok = await audioRef.current.arrancar();
      if (!ok) return;
      audioRef.current.mudo(false);
      sonidoRef.current = true;
      setSonido(true);
    } else {
      audioRef.current.mudo(true);
      sonidoRef.current = false;
      setSonido(false);
    }
  }

  const cambiarParam = useCallback((clave, valor) => {
    setTejido((t) => ({ ...t, [clave]: valor, fuente: 'modificado a mano' }));
  }, []);

  const n = useMemo(
    () => notables(tejido.R0, tejido.Rinf, tejido.fc, tejido.alpha),
    [tejido]
  );

  return (
    <div className="envoltorio">
      {intro && <Intro onCerrar={() => setIntro(false)} />}

      <header className="cabecera">
        <h1>El microscopio de frecuencia</h1>
        <p className="bajada">
          La bioimpedancia se mide pasando una corriente alterna por el tejido y
          subiendo la frecuencia. Acá se ve por qué eso dice algo: en baja frecuencia la
          corriente no puede cruzar las membranas y las rodea; al subir, empieza a
          atravesarlas. 
        </p>
      </header>

      <div className="grilla">
        <section className="col-principal">
          <Tejido tejido={tejido} estadoRef={estadoRef} pal={pal} />
          <Diagramas
            tejido={tejido}
            estadoRef={estadoRef}
            pal={pal}
            rangoF={[F_MIN, F_MAX]}
          />
        </section>

        <aside className="col-lado">
          <Controles
            tejidos={TEJIDOS}
            tejidoId={tejidoId}
            onTejido={cargar}
            u={u}
            onU={(v) => {
              setU(v);
              uRef.current = v;
            }}
            f={deLog(u)}
            barriendo={barriendo}
            onBarrido={() => setBarriendo((b) => !b)}
            sonido={sonido}
            onSonido={alternarSonido}
            paletaId={paletaId}
            onPaleta={setPaletaId}
            tejido={tejido}
            onParam={cambiarParam}
            onRestaurar={() => cargar(tejidoId)}
          />
        </aside>
      </div>

      <Lectura tejido={tejido} lectura={lectura} notables={n} sonido={sonido} />

      <footer className="pie">
        <p>
          Modelos y Simulación 2026 · Licenciatura en Sistemas, UNTDF ·
          Ezequiel Rodríguez Ibarra. El reparto de corriente que se ve sale del circuito equivalente del Modelo de Cole, y el motor de
          esta página da los mismos números que la resolución del práctico hecha en
          Python.
        </p>
      </footer>
    </div>
  );
}
