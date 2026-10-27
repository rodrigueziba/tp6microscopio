import './globals.css';

export const metadata = {
  title: 'El microscopio de frecuencia — TP6 Modelos y Simulación',
  description:
    'Modelo de Cole: ver cómo la corriente deja de rodear las células y empieza a atravesarlas al subir la frecuencia. Trabajo Práctico 6, UNTDF.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0E1116',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,400;0,500;0,700;1,400&family=Cousine:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
