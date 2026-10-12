import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import distriScope from './postcss-distri-scope.js';

export default {
  plugins: [tailwindcss(), autoprefixer(), distriScope()],
};
