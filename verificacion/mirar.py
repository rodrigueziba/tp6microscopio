"""
Abre la página en Chromium y saca capturas, para poder mirarla de verdad en
vez de suponer que quedó bien.

    python3 verificacion/mirar.py [puerto]
"""

import os
import sys

from playwright.sync_api import sync_playwright

PUERTO = sys.argv[1] if len(sys.argv) > 1 else "3300"
BASE = f"http://localhost:{PUERTO}"
SALIDA = "/tmp/claude-0/capturas"
os.makedirs(SALIDA, exist_ok=True)


def capturar(p, nombre, ancho, alto, antes=None):
    ctx = p.chromium.launch(
        executable_path="/opt/pw-browsers/chromium"
    ).new_context(viewport={"width": ancho, "height": alto}, device_scale_factor=2)
    pag = ctx.new_page()
    errores = []
    pag.on("pageerror", lambda e: errores.append(str(e)))
    pag.on("console", lambda m: errores.append(m.text) if m.type == "error" else None)
    pag.goto(BASE, wait_until="networkidle")
    if antes:
        antes(pag)
    pag.wait_for_timeout(2600)
    pag.screenshot(path=f"{SALIDA}/{nombre}.png", full_page=True)
    graves = [e for e in errores if "ERR_TUNNEL" not in e and "404" not in e]
    print(f"  [{nombre}] {'errores: ' + str(graves[:4]) if graves else 'sin errores'}")
    ctx.close()


def entrar(pag):
    pag.get_by_role("button", name="Entrar al microscopio").click()
    pag.wait_for_timeout(500)


def poner_frecuencia(pag, v):
    """El deslizador es un input controlado por React: hay que usar el setter
    nativo y disparar el evento para que el estado se entere."""
    pag.evaluate(
        """(v) => {
            const el = document.querySelector('input[type=range]');
            const set = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value').set;
            set.call(el, v);
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }""",
        str(v),
    )


def parar_barrido(pag):
    pag.get_by_role("button", name="Barriendo").click()
    pag.wait_for_timeout(300)


with sync_playwright() as p:
    capturar(p, "01-intro", 1500, 1100)

    def baja(pag):
        entrar(pag)
        parar_barrido(pag)
        poner_frecuencia(pag, 0.30)
        pag.wait_for_timeout(1500)

    capturar(p, "02-baja-frecuencia", 1760, 1500, baja)

    def alta(pag):
        entrar(pag)
        parar_barrido(pag)
        poner_frecuencia(pag, 0.82)
        pag.wait_for_timeout(1500)

    capturar(p, "03-alta-frecuencia", 1760, 1500, alta)

    def agar(pag):
        entrar(pag)
        pag.locator("select").select_option("agar")
        pag.wait_for_timeout(1200)

    capturar(p, "04-agar-medido", 1760, 1500, agar)

    def claro(pag):
        entrar(pag)
        pag.get_by_role("button", name="Claro (para proyectar)").click()
        pag.wait_for_timeout(1200)

    capturar(p, "05-claro", 1760, 1500, claro)

    capturar(p, "06-movil", 430, 1400, entrar)

print("capturas en", SALIDA)
