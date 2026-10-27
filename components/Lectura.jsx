'use client';

import { AudioMedicion } from '@/lib/audio';
import { hz, modulo, num } from '@/lib/cole';
import { CORRIENTE } from '@/lib/paletas';

function banda(f, fc) {
  const r = f / fc;
  if (r < 0.05)
    return {
      titulo: 'Muy por debajo de f_c',
      texto:
        'La membrana frena a la corriente, que en su mayor parte rodea las células ' +
        'por el líquido de afuera. El camino es largo y enredado, y por eso la ' +
        'resistencia es la más alta de todo el barrido: esto es R₀. Ojo que con un α ' +
        'chico la transición es tan ancha que ya acá hay algo de corriente cruzando.',
    };
  if (r < 0.5)
    return {
      titulo: 'Acercándose a f_c',
      texto:
        'La membrana empieza a dejar pasar algo de corriente. Aparece el desfasaje: ' +
        'la impedancia ya no es puramente resistiva.',
    };
  if (r < 2)
    return {
      titulo: 'En la zona de f_c',
      texto:
        'El punto de equilibrio entre los dos caminos. Acá la parte capacitiva está ' +
        'en su máximo, y en el diagrama de Cole la medición pasa por el vértice del arco.',
    };
  if (r < 20)
    return {
      titulo: 'Por encima de f_c',
      texto:
        'La membrana ya casi no frena. La corriente atraviesa las células y el ' +
        'camino se acorta: la resistencia baja.',
    };
  return {
    titulo: 'Muy por encima de f_c',
    texto:
      'La membrana es prácticamente un cortocircuito. Lo que queda son las dos ' +
      'resistencias en paralelo, el líquido de afuera y el interior de la célula. ' +
      'Esto es R∞.',
  };
}

export default function Lectura({ tejido, lectura, notables: n, sonido }) {
  if (!lectura) return null;
  const { f, Z, fraccion, fase } = lectura;
  const b = banda(f, tejido.fc);
  const { sonando, octavas } = AudioMedicion.transponer(f);

  return (
    <div className="fila-lectura">
      <div className="tarjeta">
        <h2>{b.titulo}</h2>
        <p className="relato">{b.texto}</p>

        <div className="medidores">
          <div className="medidor">
            <span>frecuencia</span>
            <strong>{hz(f)}</strong>
          </div>
          <div className="medidor">
            <span>|Z|</span>
            <strong>{num(modulo(Z), 1)} Ω</strong>
          </div>
          <div className="medidor">
            <span>fase</span>
            <strong>{num((fase * 180) / Math.PI, 2)}°</strong>
          </div>
          <div className="medidor">
            <span>Re Z</span>
            <strong>{num(Z.re, 1)} Ω</strong>
          </div>
          <div className="medidor">
            <span>−Im Z</span>
            <strong>{num(-Z.im, 2)} Ω</strong>
          </div>
          <div className="medidor" style={{ borderColor: CORRIENTE.adentro }}>
            <span style={{ color: CORRIENTE.adentro }}>por dentro</span>
            <strong>{num(fraccion * 100, 1)} %</strong>
          </div>
        </div>

        <p className="ayuda">{tejido.nota}</p>
      </div>

      <div className="tarjeta">
        <h2>El circuito que hay detrás</h2>
        <p className="relato">
          El Modelo de Cole no es una curva inventada para que ajuste: es{' '}
          <strong>exactamente</strong> la impedancia de dos caminos en paralelo, el
          líquido de afuera y el interior de la célula en serie con su membrana. De esa
          equivalencia sale el reparto de corriente que se ve arriba.
        </p>
        <pre className="circuito">{`   ┌───────── Re ─────────┐
───┤                      ├───
   └── Ri ── membrana ────┘`}</pre>
        <dl className="lectura">
          <dt>Re — líquido extracelular</dt>
          <dd>{num(n.Rext, 1)} Ω</dd>
          <dt>Ri — interior de la célula</dt>
          <dd>{num(n.Rint, 1)} Ω</dd>
          <dt>tope de corriente por dentro</dt>
          <dd className="destacado">{num(n.fraccionMaxima * 100, 1)} %</dd>
        </dl>
        <p className="ayuda">
          Re = R₀ y Ri = R₀·R∞/(R₀−R∞). No hay nada ajustado acá: salen de igualar
          término a término las dos expresiones.
        </p>
      </div>

      <div className="tarjeta">
        <h2>Los números del modelo</h2>
        <dl className="lectura">
          <dt>R₀ · R∞</dt>
          <dd>
            {num(tejido.R0, 1)} · {num(tejido.Rinf, 1)} Ω
          </dd>
          <dt>ΔR = R₀ − R∞</dt>
          <dd>{num(n.dR, 1)} Ω</dd>
          <dt>f_c</dt>
          <dd>{hz(tejido.fc)}</dd>
          <dt>τ = 1/(2π f_c)</dt>
          <dd>{num(n.tau * 1e6, 4)} µs</dd>
          <dt>α</dt>
          <dd>{num(tejido.alpha, 4)}</dd>
          <dt>ángulo de depresión</dt>
          <dd>{num((n.depresion * 180) / Math.PI, 1)}°</dd>
          <dt>Re Z en f_c</dt>
          <dd>{num(n.reEnFc, 1)} Ω</dd>
          <dt>−Im Z en f_c</dt>
          <dd>{num(n.imEnFc, 2)} Ω</dd>
        </dl>
        <p className="ayuda">
          El ángulo de depresión vale (1−α)·90°: es cuánto se hunde el centro del arco
          por debajo del eje. Con α = 1 el arco sería un semicírculo perfecto.
        </p>
      </div>

      <div className="tarjeta">
        <h2>Qué estás escuchando</h2>
        <p className="relato">
          La medición de bioimpedancia se hace con una corriente <strong>alterna</strong>{' '}
          de frecuencia f. Buena parte del barrido cae dentro del rango audible, así que
          hasta los 18 kHz lo que suena es la frecuencia de medición misma, sin
          transponer nada.
        </p>
        <dl className="lectura">
          <dt>frecuencia de medición</dt>
          <dd>{hz(f)}</dd>
          <dt>lo que suena</dt>
          <dd className="destacado">{num(sonando, 1)} Hz</dd>
          <dt>transposición</dt>
          <dd>
            {octavas === 0
              ? 'ninguna: es la frecuencia real'
              : `${octavas} octava${Math.abs(octavas) === 1 ? '' : 's'} ${octavas > 0 ? 'abajo' : 'arriba'}`}
          </dd>
          <dt>brillo del timbre</dt>
          <dd>sigue a la fase ({num((fase * 180) / Math.PI, 2)}°)</dd>
        </dl>
        {!sonido && (
          <p className="ayuda">Está en silencio. El botón «Sin sonido» lo enciende.</p>
        )}
      </div>
    </div>
  );
}
