// Tailwind CSS v4 se conecta como plugin de PostCSS.
// Ojo: en v4 NO existe tailwind.config.js — el tema se define con @theme
// dentro de app/globals.css.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
