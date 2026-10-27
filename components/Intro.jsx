'use client';

export default function Intro({ onCerrar }) {
  return (
    <div className="velo" role="dialog" aria-modal="true">
      <div className="hoja">
        <div className="hoja-cuerpo">
          <p className="sello">Modelos y Simulación · Trabajo Práctico 6</p>
          <h2>Por qué hace falta cambiar la frecuencia</h2>

          <p>
            Si querés saber qué hay adentro de un tejido sin abrirlo, le pasás una
            corriente y medís qué tanto se le opone. El problema es que con corriente
            continua eso no distingue casi nada: la corriente rodea las células por el
            líquido que hay entre ellas y vuelve siempre el mismo número.
          </p>

          <p>
            La membrana de una célula es una lámina de grasa con líquido conductor de los
            dos lados. Eso es, eléctricamente, <strong>un capacitor</strong>. Y un
            capacitor no deja pasar la corriente continua, pero sí la alterna, y tanto
            más cuanto más rápido alterne.
          </p>

          <p>
            Entonces: al subir la frecuencia, la corriente empieza a{' '}
            <strong>atravesar las células</strong> en vez de rodearlas. El camino se
            acorta y la impedancia baja. Medir a muchas frecuencias es ir leyendo esa
            transición, y de ahí sale todo lo que la bioimpedancia puede decir sobre un
            tejido.
          </p>

          <div className="dos-columnas">
            <section>
              <h3>Qué estás viendo</h3>
              <ul>
                <li>
                  <b>Las manchas</b> son células; la línea de alrededor es su membrana. Se
                  va volviendo tenue y punteada a medida que deja pasar corriente.
                </li>
                <li>
                  <b>Los puntos que se mueven</b> son la corriente. Los{' '}
                  <b className="azul">azules</b> van por afuera de las células, los{' '}
                  <b className="naranja">naranjas</b> las atraviesan.
                </li>
                <li>
                  <b>La proporción entre unos y otros</b> no está puesta a ojo: sale del
                  circuito equivalente del Modelo de Cole, con los parámetros del tejido
                  elegido.
                </li>
                <li>
                  <b>Las dos pantallas de abajo</b> son las dos lecturas que se usan en
                  bioimpedancia: el diagrama de Cole y el módulo contra la frecuencia.
                </li>
              </ul>
            </section>

            <section>
              <h3>Qué podés hacer</h3>
              <ul>
                <li>
                  <b>Mirá el barrido</b> una vuelta entera antes de tocar nada: va de 1 Hz
                  a 100 MHz y vuelve.
                </li>
                <li>
                  <b>Cambiá de tejido.</b> Los cinco primeros son los de la Tabla 1 del
                  enunciado; los últimos tres salieron de ajustar el modelo a mediciones
                  reales en el punto 3.
                </li>
                <li>
                  <b>Tocá los cuatro parámetros</b> y mirá qué le hace cada uno al arco y
                  al reparto de corriente. Bajá α y mirá cómo se aplana el arco.
                </li>
                <li>
                  <b>Encendé el sonido.</b> Hasta los 18 kHz lo que escuchás es,
                  literalmente, la frecuencia de medición.
                </li>
              </ul>
            </section>
          </div>

          <p className="prueba">
            Para empezar: poné «Músculo longitudinal» y mirá el barrido. Prestá atención a
            cuándo empiezan a aparecer los puntos naranjas y comparalo con dónde está f_c
            en la pantalla de la derecha.
          </p>
        </div>

        <div className="hoja-pie">
          <button className="bot grande" onClick={onCerrar}>
            Entrar al microscopio
          </button>
        </div>
      </div>
    </div>
  );
}
