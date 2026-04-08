# Punto Pago — Cotizador

Cotizador comercial (Next.js) para armar propuestas con integración, comisiones y exportación a PDF.

## Repositorio en GitHub

**URL:** [https://github.com/Juancalidoso01/punto-pago-cotizador](https://github.com/Juancalidoso01/punto-pago-cotizador)

En esa página ves el código, commits y este README. GitHub **no ejecuta** la app; para una **vista previa en el navegador** hay que desplegarla (recomendado: Vercel).

## Vista previa en vivo (recomendado: Vercel)

1. Entra en [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. **Add New Project** → importa el repo `Juancalidoso01/punto-pago-cotizador`.
3. Deja la configuración por defecto (Next.js) y pulsa **Deploy**.
4. Al terminar, Vercel te dará una URL del tipo `https://punto-pago-cotizador-xxx.vercel.app`.

Opcional: en GitHub, en el repo → **Settings** → **General** → **Website** (campo del *About*), pega la URL de Vercel para abrirla desde la página del repositorio.

## Variables de entorno (producción)

Para **Registrar en Google Sheets**, en Vercel añade:

- `COTIZACION_SHEET_WEBHOOK_URL` — URL del webhook (p. ej. Google Apps Script).

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando        | Descripción              |
| -------------- | ------------------------ |
| `npm run dev`  | Servidor de desarrollo   |
| `npm run build`| Compilación producción   |
| `npm run start`| Servidor producción      |
