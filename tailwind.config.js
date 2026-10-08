/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", // Aquí puedes agregar los archivos donde uses clases tailwind
    "./app/**/*.{js,jsx,ts,tsx}",// Agrega todas las rutas de tu proyecto
    "./componentes/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}