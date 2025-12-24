/**
 * Per-user playlist routing preferences.
 * - defaultPlaylist: target when similarity is above threshold or unspecified.
 * - uncertainPlaylist: fallback when similarity is below threshold.
 * - similarityThreshold: range 0–1; null/undefined uses 0.6 default.
 */
export type PlaylistPreferences = {
    defaultPlaylist?: string | null;
    uncertainPlaylist?: string | null;
    similarityThreshold?: number | null;
};

const normalize = (value?: string | null) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

export function resolvePlaylistTarget(options: {
    requestedPlaylist?: string | null;
    similarity: number;
    preferences: PlaylistPreferences;
    envDefault?: string | null;
    envUncertain?: string | null;
}) {
    const similarityThreshold = Math.min(
        Math.max(
            typeof options.preferences.similarityThreshold === 'number'
                ? options.preferences.similarityThreshold
                : 0.6,
            0
        ),
        1
    );

    const basePlaylist =
        normalize(options.requestedPlaylist) ??
        normalize(options.preferences.defaultPlaylist) ??
        normalize(options.envDefault);

    const uncertainPlaylist =
        normalize(options.preferences.uncertainPlaylist) ??
        normalize(options.envUncertain);

    const targetPlaylist =
        options.similarity < similarityThreshold && uncertainPlaylist
            ? uncertainPlaylist
            : basePlaylist;

    return {
        basePlaylist: basePlaylist ?? null,
        targetPlaylist: targetPlaylist ?? null,
        similarityThreshold
    };
}
