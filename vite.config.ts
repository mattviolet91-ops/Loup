/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Chemin public de l'application.
 * - En production, l'application est publiée sur GitHub Pages à l'adresse
 *   https://<utilisateur>.github.io/Loup/ : tous les assets doivent donc être
 *   préfixés par `/Loup/`.
 * - En développement (`npm run dev`), on reste à la racine `/`.
 * - `VITE_BASE` permet de surcharger ce choix pour un hébergeur qui sert
 *   l'application à la racine (Netlify, Vercel, domaine personnalisé) :
 *   `VITE_BASE=/ npm run build`.
 */
const GITHUB_PAGES_BASE = '/Loup/';

export default defineConfig(({ command }) => {
  const base = process.env.VITE_BASE ?? (command === 'build' ? GITHUB_PAGES_BASE : '/');

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/favicon.svg'],
        manifest: {
          id: base,
          name: 'Loup-Garou de Thiercelieux',
          short_name: 'Loup-Garou',
          description:
            "Jouez aux Loups-Garous de Thiercelieux entre amis, sur un seul téléphone, avec un narrateur automatique.",
          theme_color: '#0b0f1a',
          background_color: '#0b0f1a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: base,
          scope: base,
          lang: 'fr',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  };
});
