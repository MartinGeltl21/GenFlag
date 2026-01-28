import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface DuelGame {
    id: string;
    player1_id: string | null;
    player1_name: string;
    player1_lives: number;
    player1_answered: boolean;
    player1_correct: boolean;
    player1_connected: boolean;
    player2_id: string | null;
    player2_name: string | null;
    player2_lives: number;
    player2_answered: boolean;
    player2_correct: boolean;
    player2_connected: boolean;
    current_flag_code: string | null;
    round_number: number;
    round_start_time: string | null;
    status: "waiting" | "active" | "finished";
    winner: "player1" | "player2" | null;
    created_at: string;
    updated_at: string;
}

export type PlayerRole = "player1" | "player2";

/**
 * Create a new duel game
 */
export async function createDuelGame(
    playerName: string,
    userId?: string
): Promise<{ gameId: string; error: string | null }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("duel_games")
        .insert({
            player1_id: userId || null,
            player1_name: playerName,
            status: "waiting",
        })
        .select("id")
        .single();

    if (error) {
        console.error("Error creating duel game:", error);
        return { gameId: "", error: error.message };
    }

    return { gameId: data.id, error: null };
}

/**
 * Join an existing duel game
 */
export async function joinDuelGame(
    gameId: string,
    playerName: string,
    userId?: string
): Promise<{ success: boolean; error: string | null; game?: DuelGame }> {
    const supabase = createClient();

    // First check the game status
    const { data: game, error: fetchError } = await supabase
        .from("duel_games")
        .select("*")
        .eq("id", gameId)
        .single();

    if (fetchError || !game) {
        return { success: false, error: "Spiel nicht gefunden" };
    }

    if (game.status !== "waiting") {
        return { success: false, error: "Spiel hat bereits begonnen" };
    }

    if (game.player2_name) {
        return { success: false, error: "Spiel ist bereits voll" };
    }

    // Join the game
    const { data: updatedGame, error: updateError } = await supabase
        .from("duel_games")
        .update({
            player2_id: userId || null,
            player2_name: playerName,
            player2_connected: true,
            updated_at: new Date().toISOString(),
        })
        .eq("id", gameId)
        .select("*")
        .single();

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true, error: null, game: updatedGame };
}

/**
 * Get an existing duel game
 */
export async function getDuelGame(
    gameId: string
): Promise<{ game: DuelGame | null; error: string | null }> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("duel_games")
        .select("*")
        .eq("id", gameId)
        .single();

    if (error) {
        return { game: null, error: error.message };
    }

    return { game: data, error: null };
}

/**
 * Start the game (called by player1 when player2 joins)
 */
export async function startGame(
    gameId: string,
    firstFlagCode: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();

    const { error } = await supabase
        .from("duel_games")
        .update({
            status: "active",
            current_flag_code: firstFlagCode,
            round_number: 1,
            round_start_time: new Date().toISOString(),
            player1_answered: false,
            player2_answered: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", gameId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

/**
 * Submit an answer for the current round
 */
export async function submitAnswer(
    gameId: string,
    playerRole: PlayerRole,
    isCorrect: boolean
): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();

    const updateData: Record<string, boolean | string> = {
        [`${playerRole}_answered`]: true,
        [`${playerRole}_correct`]: isCorrect,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("duel_games")
        .update(updateData)
        .eq("id", gameId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

/**
 * Process round results (called when both players have answered or timeout)
 */
export async function processRoundResults(
    gameId: string,
    game: DuelGame
): Promise<{ finished: boolean; error: string | null }> {
    const supabase = createClient();

    let player1Lives = game.player1_lives;
    let player2Lives = game.player2_lives;

    // Deduct lives for incorrect/no answers
    if (!game.player1_correct || !game.player1_answered) {
        player1Lives--;
    }
    if (!game.player2_correct || !game.player2_answered) {
        player2Lives--;
    }

    // Check for game over
    let status: "active" | "finished" = "active";
    let winner: "player1" | "player2" | null = null;

    if (player1Lives <= 0 && player2Lives <= 0) {
        // Both lost at the same time - it's a draw, but we pick the one with more correct answers
        status = "finished";
        winner = null; // Draw
    } else if (player1Lives <= 0) {
        status = "finished";
        winner = "player2";
    } else if (player2Lives <= 0) {
        status = "finished";
        winner = "player1";
    }

    const { error } = await supabase
        .from("duel_games")
        .update({
            player1_lives: player1Lives,
            player2_lives: player2Lives,
            status,
            winner,
            updated_at: new Date().toISOString(),
        })
        .eq("id", gameId);

    if (error) {
        return { finished: false, error: error.message };
    }

    return { finished: status === "finished", error: null };
}

/**
 * Start the next round with a new flag
 */
export async function nextRound(
    gameId: string,
    flagCode: string,
    currentRound: number
): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();

    const { error } = await supabase
        .from("duel_games")
        .update({
            current_flag_code: flagCode,
            round_number: currentRound + 1,
            round_start_time: new Date().toISOString(),
            player1_answered: false,
            player2_answered: false,
            player1_correct: false,
            player2_correct: false,
            updated_at: new Date().toISOString(),
        })
        .eq("id", gameId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

/**
 * Handle player disconnection
 */
export async function handleDisconnect(
    gameId: string,
    playerRole: PlayerRole
): Promise<{ success: boolean; error: string | null }> {
    const supabase = createClient();

    const winner = playerRole === "player1" ? "player2" : "player1";

    const { error } = await supabase
        .from("duel_games")
        .update({
            [`${playerRole}_connected`]: false,
            status: "finished",
            winner,
            updated_at: new Date().toISOString(),
        })
        .eq("id", gameId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, error: null };
}

/**
 * Subscribe to game updates via Realtime
 */
export function subscribeToGame(
    gameId: string,
    onUpdate: (game: DuelGame) => void
): RealtimeChannel {
    const supabase = createClient();

    const channel = supabase
        .channel(`duel:${gameId}`)
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "duel_games",
                filter: `id=eq.${gameId}`,
            },
            (payload) => {
                onUpdate(payload.new as DuelGame);
            }
        )
        .subscribe();

    return channel;
}

/**
 * Unsubscribe from game updates
 */
export function unsubscribeFromGame(channel: RealtimeChannel): void {
    const supabase = createClient();
    supabase.removeChannel(channel);
}

/**
 * Generate invitation link
 */
export function getInvitationLink(gameId: string): string {
    if (typeof window !== "undefined") {
        return `${window.location.origin}/game/duel/${gameId}`;
    }
    return `/game/duel/${gameId}`;
}
