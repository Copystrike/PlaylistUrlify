// src/lib/ai.ts
import { ExtractSongDetailsPrompt } from './queryRefinePrompt';
import { SongInfo } from '../dto/SongInfo';



/**
 * @todo AI
 * Cleans and refines a song query using a Large Language Model (Groq).
 * This function takes a raw song title, sends it to the Groq API with a specific prompt,
 * and parses the structured JSON output to create a refined search query for Spotify.
 *
 * @param songQuery The raw song query string (e.g., "Artist - Title (feat. Other Artist)").
 * @param apiKey The API key for the Groq service.
 * @returns A refined query string in the format "title artist1 artist2...".
 * If the AI processing fails, it logs a warning and returns the original query.
 */
export async function QueryCleaning(songQuery: string, apiKey: string): Promise<SongInfo> {

    console.log(`QueryCleaning called with songQuery: "${songQuery}"`);

    const messages = ExtractSongDetailsPrompt(songQuery);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    let attempts = 0;
    let parsedResponse = null;

    while (attempts < 3) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'openai/gpt-oss-120b',
                    messages,
                    temperature: 0.1,
                    max_completion_tokens: 8192,
                    top_p: 1,
                    reasoning_effort: 'low',
                    stream: false,
                    response_format: { type: 'json_object' },
                    stop: null,
                }),
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;

            parsedResponse = content ? JSON.parse(content) : null;
        } catch (error) {
            console.warn(`Groq request attempt ${attempts + 1} failed:`, error);
        }

        if (parsedResponse && SongInfo.validate(parsedResponse) && parsedResponse.title) {
            return new SongInfo(parsedResponse.title, parsedResponse.artist);
        }

        attempts++;
        await delay(10000);
    }

    return new SongInfo(songQuery, []);
}
