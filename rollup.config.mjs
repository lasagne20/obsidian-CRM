import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'main.ts',  // ou main.js selon ton projet
  output: {
    file: 'export/plugin.js', // fichier final pour Obsidian
    format: 'cjs',            // Obsidian attend du CommonJS
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript()
  ]
};
