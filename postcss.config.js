import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('postcss').Config} */
export default {
  plugins: {
    'tailwindcss': {
      config: path.resolve(__dirname, './client/tailwind.config.ts')
    },
    'autoprefixer': {},
  }
};