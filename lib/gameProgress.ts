import { createClient } from "@/lib/supabase/client";

export interface GameProgress {
    score: number;
    total?: number;
    lives?: number;
    flagHistory?: string[];
    selectedRegion?: string;
    // Issue #15: persist the exact question the player stopped at so it can't
    // be re-rolled by reloading the page.
    currentFlag?: string;       // cca2 of the currently shown flag
    options?: string[];         // multiple-choice options (German names); omitted in expert mode
    correctAnswer?: string;     // German name of the correct answer
    remainingTime?: number;     // seconds left on the question timer (Issue #14)
    savedAt: string;
}

type GameMode = "classic" | "expert" | "survival" | "regions";

const STORAGE_KEY_PREFIX = "genflag_progress_";

/**
 * Save game progress - uses Supabase for logged-in users, LocalStorage as fallback
 */
export async function saveGameProgress(gameMode: GameMode, state: Omit<GameProgress, "savedAt">): Promise<void> {
    const progressWithTimestamp: GameProgress = {
        ...state,
        savedAt: new Date().toISOString(),
    };

    console.log('🔵 Saving game progress:', gameMode, progressWithTimestamp);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        console.log('🔵 User logged in, saving to Supabase');
        // Save to Supabase for logged-in users
        const { error } = await supabase
            .from("game_progress")
            .upsert({
                user_id: user.id,
                game_mode: gameMode,
                state: progressWithTimestamp,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: "user_id,game_mode"
            });

        if (error) {
            console.error("❌ Error saving progress to Supabase:", error);
            // Fallback to LocalStorage
            saveToLocalStorage(gameMode, progressWithTimestamp);
        } else {
            console.log('✅ Progress saved to Supabase successfully');
        }
    } else {
        console.log('🔵 No user logged in, saving to LocalStorage');
        // Use LocalStorage for non-logged-in users
        saveToLocalStorage(gameMode, progressWithTimestamp);
    }
}

/**
 * Load game progress
 */
export async function loadGameProgress(gameMode: GameMode): Promise<GameProgress | null> {
    console.log('🔍 Loading game progress for:', gameMode);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        console.log('🔍 User logged in, loading from Supabase');
        // Try Supabase first
        const { data, error } = await supabase
            .from("game_progress")
            .select("state")
            .eq("user_id", user.id)
            .eq("game_mode", gameMode)
            .single();

        if (!error && data?.state) {
            console.log('✅ Progress loaded from Supabase:', data.state);
            return data.state as GameProgress;
        } else {
            console.log('⚠️ No progress found in Supabase:', error?.message || 'No data');
        }
    } else {
        console.log('🔍 No user logged in, loading from LocalStorage');
    }

    // Fallback to LocalStorage
    const localData = loadFromLocalStorage(gameMode);
    console.log('LocalStorage data:', localData);
    return localData;
}

/**
 * Clear game progress (on game over or manual restart)
 */
export async function clearGameProgress(gameMode: GameMode): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        await supabase
            .from("game_progress")
            .delete()
            .eq("user_id", user.id)
            .eq("game_mode", gameMode);
    }

    // Always clear LocalStorage as well
    clearLocalStorage(gameMode);
}

/**
 * Check if there's saved progress
 */
export async function hasGameProgress(gameMode: GameMode): Promise<boolean> {
    const progress = await loadGameProgress(gameMode);
    return progress !== null;
}

// LocalStorage helpers
function saveToLocalStorage(gameMode: GameMode, state: GameProgress): void {
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + gameMode, JSON.stringify(state));
    } catch (e) {
        console.error("Error saving to LocalStorage:", e);
    }
}

function loadFromLocalStorage(gameMode: GameMode): GameProgress | null {
    try {
        const data = localStorage.getItem(STORAGE_KEY_PREFIX + gameMode);
        if (data) {
            return JSON.parse(data) as GameProgress;
        }
    } catch (e) {
        console.error("Error loading from LocalStorage:", e);
    }
    return null;
}

function clearLocalStorage(gameMode: GameMode): void {
    try {
        localStorage.removeItem(STORAGE_KEY_PREFIX + gameMode);
    } catch (e) {
        console.error("Error clearing LocalStorage:", e);
    }
}
