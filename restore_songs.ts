
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { QueryCleaning } from './src/lib/ai';
import { calculateSimilarity } from './src/lib/utils';
import { searchTrackBySongInfo, findUserPlaylist, addTrackToPlaylist } from './src/lib/spotify';

const SONGS_TO_RESTORE = [
    "30 Nov 2025 at 09:47 Flashing Lights (feat. Dwele) by artists: Kanye West",
    "6 Dec 2025 at 07:47 Pap Smear by artists: Crystal Castles",
    "8 Dec 2025 at 12:08 Sleigh Ride by artists: The Ronettes",
    "8 Dec 2025 at 12:09 Sleigh Ride (Indian Christmas Remix) by artists: Vindaloo Singh",
    "9 Dec 2025 at 11:50  by artists: ",
    "9 Dec 2025 at 11:52  by artists: ",
    "9 Dec 2025 at 12:59 Feel My Needs (Purple Disco Machine Extended Mix) by artists: WEISS",
    "11 Dec 2025 at 08:36 Miles Away by artists: Ofenbach",
    "11 Dec 2025 at 17:36 winning is everything. by artists: HÈXLXHZ",
    "11 Dec 2025 at 17:39 winning is everything. by artists: HÈXLXHZ",
    "13 Dec 2025 at 20:40 Unwritten by artists: Natasha Bedingfield",
    "17 Dec 2025 at 14:31  by artists: ",
    "17 Dec 2025 at 14:32  by artists: ",
    "18 Dec 2025 at 18:12 Where Have You Been (Orchestra Remix) by artists: Lewis Hanton & Orchestra Club",
    "20 Dec 2025 at 18:18 Wild Thoughts (feat. Rihanna & Bryson Tiller) by artists: DJ Khaled",
    "20 Dec 2025 at 18:31 Djadja (Spanish Remix) by artists: Hansel Casty",
    "20 Dec 2025 at 20:05 Acenda o Farol (Funk Remix) by artists: Math Gomes & JEO BEATZ",
    "20 Dec 2025 at 20:16 Phantom by artists: EsDeeKid & Rico Ace",
    "20 Dec 2025 at 21:23 No Broke Boys by artists: Tinashe",
    "20 Dec 2025 at 21:48  by artists: ",
    "20 Dec 2025 at 21:51  by artists: ",
    "20 Dec 2025 at 21:53  by artists: ",
    "20 Dec 2025 at 21:54 FE!N (feat. Playboi Carti) by artists: Travis Scott",
    "20 Dec 2025 at 21:57  by artists: ",
    "20 Dec 2025 at 23:56  by artists: ",
    "20 Dec 2025 at 23:57  by artists: ",
    "21 Dec 2025 at 00:03  by artists: ",
    "21 Dec 2025 at 12:21 Fuckery by artists: Pyrophoria",
    "21 Dec 2025 at 12:48 Stone Cold Eyes by artists: it's murph & Emi Grace",
    "21 Dec 2025 at 14:26 Nice To Meet Ya by artists: Wes Nelson & Yxng Bane"
];

async function main() {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_ACCESS_TOKEN = process.env.SPOTIFY_ACCESS_TOKEN;
    const PLAYLIST_NAME = process.env.PLAYLIST_NAME;
    const UNCERTAIN_PLAYLIST_NAME = process.env.UNCERTAIN_PLAYLIST_NAME || "[DEV] Uncertain Matches";

    if (!GROQ_API_KEY) {
        console.error("Missing GROQ_API_KEY in .env");
        process.exit(1);
    }
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_ACCESS_TOKEN) {
        console.error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_ACCESS_TOKEN in .env");
        process.exit(1);
    }
    if (!PLAYLIST_NAME) {
        console.error("Missing PLAYLIST_NAME in .env");
        process.exit(1);
    }

    console.log(`Starting restore process for ${SONGS_TO_RESTORE.length} items...`);
    console.log(`Loaded Configuration:`);
    console.log(`- TARGET PLAYLIST: ${PLAYLIST_NAME}`);
    console.log(`- CLIENT ID: ${SPOTIFY_CLIENT_ID?.substring(0, 5)}...`);
    console.log(`- ACCESS TOKEN: ${SPOTIFY_ACCESS_TOKEN?.substring(0, 5)}... (Length: ${SPOTIFY_ACCESS_TOKEN?.length})`);
    console.log(`- UNCERTAIN PLAYLIST: ${UNCERTAIN_PLAYLIST_NAME}`);

    const sdk = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID, {
        access_token: SPOTIFY_ACCESS_TOKEN,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "",
    });

    for (const rawEntry of SONGS_TO_RESTORE) {
        // Strict filtering for empty artist entries
        // e.g. "9 Dec 2025 at 11:50  by artists: "
        const parts = rawEntry.split("by artists:");
        if (parts.length < 2 || !parts[1].trim()) {
            console.log(`[SKIP] Empty/Malformed entry: "${rawEntry}"`);
            continue;
        }

        try {
            console.log(`\nProcessing: "${rawEntry}"`);

            const cleanedSongInfo = await QueryCleaning(rawEntry, GROQ_API_KEY);
            console.log(`   Cleaned: "${cleanedSongInfo.title}" by ${cleanedSongInfo.artist.join(", ")}`);

            const track = await searchTrackBySongInfo(sdk, cleanedSongInfo);

            if (!track) {
                console.log(`   [FAILED] Not found on Spotify.`);
                continue;
            }

            const trackString = `${track.name} ${track.artists.map(a => a.name).join(' ')}`;
            const queryArtistString = cleanedSongInfo.artist ? cleanedSongInfo.artist.join(' ') : '';
            const queryString = `${cleanedSongInfo.title} ${queryArtistString}`;
            const similarity = calculateSimilarity(trackString, queryString);

            console.log(`   Match: "${track.name}" (Similarity: ${similarity.toFixed(2)})`);

            let targetPlaylistName = PLAYLIST_NAME;
            const SIMILARITY_THRESHOLD = 0.6;

            if (similarity < SIMILARITY_THRESHOLD) {
                targetPlaylistName = UNCERTAIN_PLAYLIST_NAME;
                console.log(`   [WARN] Low similarity. Targeting "${targetPlaylistName}"`);
            }

            const playlist = await findUserPlaylist(sdk, targetPlaylistName);
            if (!playlist) {
                if (targetPlaylistName !== PLAYLIST_NAME) {
                    console.log(`   [INFO] "${targetPlaylistName}" not found. Falling back to "${PLAYLIST_NAME}".`);
                    const fallback = await findUserPlaylist(sdk, PLAYLIST_NAME);
                    if (fallback) {
                        await addTrackToPlaylist(sdk, fallback.id, track.uri);
                        console.log(`   [SUCCESS] Added to "${fallback.name}" (Fallback).`);
                        continue;
                    }
                }
                console.log(`   [FAILED] Playlist "${targetPlaylistName}" not found.`);
                continue;
            }

            await addTrackToPlaylist(sdk, playlist.id, track.uri);
            console.log(`   [SUCCESS] Added to "${playlist.name}".`);

        } catch (e: any) {
            // Check for 401 or Bad token error
            if (e?.message?.includes("Bad or expired token") || e?.status === 401) {
                console.error("\n[CRITICAL ERROR] Spotify Access Token is invalid or expired.");
                console.error("Please log in again to get a fresh token and update SPOTIFY_ACCESS_TOKEN in .env");
                process.exit(1);
            }
            console.error(`   [ERROR] Failed to process entry:`, e);
        }
    }
    console.log("\nRestore process completed.");
}

main();
