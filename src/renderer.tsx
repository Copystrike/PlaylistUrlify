import { jsxRenderer } from 'hono/jsx-renderer';
import { ViteClient } from 'vite-ssr-components/hono';
import { Link } from 'vite-ssr-components/hono';


export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Spotify Shortcut Helper</title>
        <meta name="description" content="Log in with Spotify to generate your API key and start adding songs from your iPhone Shortcuts." />
        <Link rel="stylesheet" href="/src/style.css" />
        <ViteClient />
      </head>
      <body>{children}</body>
    </html>
  );
});
