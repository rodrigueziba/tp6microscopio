'use client';

import { hz, num } from '@/lib/cole';
import { PALETAS } from '@/lib/paletas';

function Numero({ valor, onCambio, paso, min = 0 }) {
  return (
    <input
      className="num"
      type="text"
      inputMode="decimal"
      value={String(valor).replace('.', ',')}
      onChange={(e) => {
        const v = parseFloat(e.target.value.replace(',', '.'));
        if (Number.isFinite(v) && v >= min) onCambio(v);
      }}
      step={paso}
    />
  );
}

export default function Controles({
  tejidos,
  tejidoId,
  onTejido,
  u,
  onU,
  f,
  barriendo,
  onBarrido,
  sonido,
  onSonido,
  paletaId,
  onPaleta,
  tejido,
  onParam,
  onRestaurar,
}) {
  const tabla = tejidos.filter((t) => !t.medido);
  const medidos = tejidos.filter((t) => t.medido);

  return (
    <div className="tarjeta">
      <h2>Mando</h2>

      <label className="campo">
        <span>Tejido</span>
        <select value={tejidoId} onChange={(e) => onTejido(e.target.value)}>
          <optgroup label="Tabla 1 del enunciado">
            {tabla.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </optgroup>
          <optgroup label="Ajustados a mediciones reales (punto 3)">
            {medidos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <label className="campo">
        <span>
          Frecuencia de medición <em>{hz(f)}</em>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.0005}
          value={u}
          onChange={(e) => onU(parseFloat(e.target.value))}
        />
      </label>

      <div className="transporte">
        <button className={barriendo ? 'bot activo' : 'bot'} onClick={onBarrido}>
          {barriendo ? 'Barriendo' : 'Barrer'}
        </button>
        <button className={sonido ? 'bot activo' : 'bot'} onClick={onSonido}>
          {sonido ? 'Sonido' : 'Sin sonido'}
        </button>
      </div>
      <p className="ayuda">
        El barrido recorre todo el espectro de 1 Hz a 100 MHz y vuelve. Para mirar una
        frecuencia fija, apagalo y usá el deslizador.
      </p>

      <h3>Los cuatro parámetros</h3>
      <p className="ayuda">
        Son los del Modelo de Cole. Si los cambiás, todo lo demás se recalcula: el
        arco, el reparto de corriente y el circuito equivalente.
      </p>
      <div className="perillas">
        <label className="perilla">
          <span>
            R<sub>0</sub> [Ω]
          </span>
          <Numero
            valor={num(tejido.R0, 2)}
            paso={5}
            min={1}
            onCambio={(v) => onParam('R0', Math.max(v, tejido.Rinf + 1))}
          />
        </label>
        <label className="perilla">
          <span>R∞ [Ω]</span>
          <Numero
            valor={num(tejido.Rinf, 2)}
            paso={5}
            min={0.1}
            onCambio={(v) => onParam('Rinf', Math.min(v, tejido.R0 - 1))}
          />
        </label>
        <label className="perilla">
          <span>
            f<sub>c</sub> [kHz]
          </span>
          <Numero
            valor={num(tejido.fc / 1e3, 4)}
            paso={1}
            min={1e-6}
            onCambio={(v) => onParam('fc', Math.max(v, 1e-6) * 1e3)}
          />
        </label>
        <label className="perilla">
          <span>α</span>
          <Numero
            valor={num(tejido.alpha, 4)}
            paso={0.05}
            min={0.01}
            onCambio={(v) => onParam('alpha', Math.min(Math.max(v, 0.01), 1))}
          />
        </label>
      </div>
      <button className="bot ancho" onClick={onRestaurar}>
        Volver a los valores del tejido
      </button>

      <h3>Terminación</h3>
      <div className="paletas">
        {PALETAS.map((p) => (
          <button
            key={p.id}
            className={p.id === paletaId ? 'chapa activa' : 'chapa'}
            onClick={() => onPaleta(p.id)}
          >
            <i style={{ background: p.medio, borderColor: p.membrana }} />
            {p.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
