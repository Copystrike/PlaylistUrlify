/// <reference types="vitest" />
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig, type PluginOption } from 'vite';
import ssrPlugin from 'vite-ssr-components/plugin';

const isTest = process.env.VITEST === 'true';
const plugins: PluginOption[] = [
  ssrPlugin(),
  ...(isTest ? [] as PluginOption[] : [cloudflare()])
];

export default defineConfig({
  plugins,
  test: {
    globals: true,
    environment: 'node',
  },
});
