/**
 * audio.js — escuchar la corriente de medición.
 *
 * Acá el sonido no es una analogía: la bioimpedancia se mide inyectando una
 * corriente ALTERNA de frecuencia f, y buena parte del barrido cae dentro del
 * rango audible. Entre 20 Hz y 20 kHz lo que se escucha es, literalmente, la
 * frecuencia de medición. Por encima de 20 kHz no hay oído que la siga, así
 * que se la baja por octavas enteras hasta dejarla audible, y la pieza avisa
 * cuántas.
 *
 * Además el timbre sigue a la fase de la impedancia: cuanto más capacitivo se
 * pone el tejido, más se abre el filtro. Esa relación también sale del modelo.
 */

const AGUDO_MAXIMO = 18000;

export class AudioMedicion {
  constructor() {
    this.ctx = null;
    this.listo = false;
    this.silencio = false;
  }

  async arrancar() {
    if (this.listo) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return true;
    }
    const AC =
      typeof window !== 'undefined' &&
      (window.AudioContext || window.webkitAudioContext);
    if (!AC) return false;

    const ctx = new AC();
    if (ctx.state === 'suspended') await ctx.resume();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    comp.connect(ctx.destination);

    const maestro = ctx.createGain();
    maestro.gain.value = 0.0;
    maestro.connect(comp);

    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 2000;
    filtro.Q.value = 0.8;
    filtro.connect(maestro);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    osc.connect(filtro);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 440;
    const g2 = ctx.createGain();
    g2.gain.value = 0.16;
    osc2.connect(g2);
    g2.connect(filtro);

    osc.start();
    osc2.start();

    Object.assign(this, { ctx, maestro, filtro, osc, osc2, listo: true });
    return true;
  }

  /**
   * Cuántas octavas hay que bajar f para que entre en el rango audible, y a
   * qué frecuencia queda. Octavas enteras, para que la relación entre dos
   * frecuencias de medición se conserve al oído.
   */
  static transponer(f) {
    let octavas = 0;
    let sonando = f;
    while (sonando > AGUDO_MAXIMO) {
      sonando /= 2;
      octavas += 1;
    }
    while (sonando < 40 && sonando > 0) {
      sonando *= 2;
      octavas -= 1;
    }
    return { sonando, octavas };
  }

  /** Se llama una vez por cuadro. `fase` en radianes, negativa y chica. */
  actualizar({ f, fase }) {
    if (!this.listo || this.silencio) return;
    const t = this.ctx.currentTime;
    const { sonando } = AudioMedicion.transponer(f);

    this.osc.frequency.setTargetAtTime(sonando, t, 0.04);
    this.osc2.frequency.setTargetAtTime(sonando, t, 0.04);

    // cuanto más capacitivo el tejido, más brillante el timbre
    const cap = Math.min(1, Math.abs(fase) / 0.6);
    this.filtro.frequency.setTargetAtTime(
      Math.min(12000, sonando * (1.6 + 5 * cap)),
      t,
      0.06
    );
    this.maestro.gain.setTargetAtTime(0.13, t, 0.08);
  }

  mudo(v) {
    this.silencio = v;
    if (v && this.listo) {
      this.maestro.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }
}
