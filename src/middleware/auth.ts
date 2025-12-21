// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { env } from 'hono/adapter';
import { refreshAccessToken } from '../lib/spotify';

declare module 'hono' {
    interface ContextRenderer { }
    interface ContextVariableMap {
        currentUser: {
            id: string;
            access_token: string;
            refresh_token: string;
            expires_at: number;
            api_key: string;
        };
    }
}

export const requireAuth = createMiddleware<{ Bindings: CloudflareBindings; }>(async (c, next) => {
    const sessionId = getCookie(c, '__session');
    const { DB, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = env(c);

    if (!sessionId) {
        console.log('No __session cookie, redirecting to login.');
        return c.redirect('/login');
    }

    const session = await DB.prepare('SELECT user_id FROM sessions WHERE id = ?').bind(sessionId).first<{ user_id: string; }>();

    if (!session) {
        console.warn(`Session with ID ${sessionId} not found in DB, clearing cookie and redirecting to login.`);
        c.res.headers.append('Set-Cookie', '__session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax;');
        return c.redirect('/login');
    }

    let user = await DB.prepare('SELECT * FROM users WHERE id = ?').bind(session.user_id).first<{
        id: string;
        access_token: string;
        refresh_token: string;
        expires_at: number;
        api_key: string;
    }>();

    if (!user) {
        console.warn(`User with ID ${session.user_id} not found in DB, clearing session and redirecting to login.`);
        await DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
        c.res.headers.append('Set-Cookie', '__session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax;');
        return c.redirect('/login');
    }

    // Check for token expiry and refresh if needed
    const now = Math.floor(Date.now() / 1000);
    const FIVE_MINUTES_IN_SECONDS = 5 * 60;

    if (user.expires_at <= now + FIVE_MINUTES_IN_SECONDS) {
        console.log(`Access token for user ${user.id} is expired or nearing expiry. Attempting to refresh.`);
        if (user.refresh_token) {
            const newTokens = await refreshAccessToken(
                user.refresh_token,
                SPOTIFY_CLIENT_ID,
                SPOTIFY_CLIENT_SECRET,
                user.id,
                DB
            );

            if (newTokens) {
                // Update the local user object with new tokens so downstream handlers get the fresh ones
                user = {
                    ...user,
                    access_token: newTokens.access_token,
                    refresh_token: newTokens.refresh_token || user.refresh_token,
                    expires_at: now + newTokens.expires_in
                };
                console.log(`Access token refreshed successfully for user ${user.id}.`);
            } else {
                console.error(`Failed to refresh token for user ${user.id}. Redirecting to re-auth.`);
                // Force re-login
                return c.redirect('/login');
            }
        } else {
            console.warn(`User ${user.id} has no refresh token. Redirecting to login.`);
            return c.redirect('/login');
        }
    }

    c.set('currentUser', user);
    await next();
});