import { describe, it, expect } from 'vitest';
import { resolvePlaylistTarget } from './preferences';

describe('resolvePlaylistTarget', () => {
    it('prefers user configured playlists when provided', () => {
        const result = resolvePlaylistTarget({
            requestedPlaylist: null,
            similarity: 0.4,
            preferences: {
                defaultPlaylist: 'Daily Mix',
                uncertainPlaylist: 'Needs Review',
                similarityThreshold: 0.5
            },
            envDefault: 'Env Default',
            envUncertain: 'Env Uncertain'
        });

        expect(result.basePlaylist).toBe('Daily Mix');
        expect(result.targetPlaylist).toBe('Needs Review');
        expect(result.similarityThreshold).toBe(0.5);
    });

    it('falls back to env defaults when user settings are missing', () => {
        const result = resolvePlaylistTarget({
            requestedPlaylist: undefined,
            similarity: 0.9,
            preferences: {},
            envDefault: 'Env Default',
            envUncertain: 'Env Uncertain'
        });

        expect(result.basePlaylist).toBe('Env Default');
        expect(result.targetPlaylist).toBe('Env Default');
    });

    it('uses provided playlist override even when similarity is high', () => {
        const result = resolvePlaylistTarget({
            requestedPlaylist: 'From Request',
            similarity: 0.95,
            preferences: {
                defaultPlaylist: 'Default',
                uncertainPlaylist: 'Low Confidence',
                similarityThreshold: 0.6
            }
        });

        expect(result.basePlaylist).toBe('From Request');
        expect(result.targetPlaylist).toBe('From Request');
    });
});
