import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { gameId, playerRole } = body;

        if (!gameId || !playerRole) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // Use service role key for server-side operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const winner = playerRole === "player1" ? "player2" : "player1";

        const { error } = await supabase
            .from("duel_games")
            .update({
                [`${playerRole}_connected`]: false,
                status: "finished",
                winner,
                updated_at: new Date().toISOString(),
            })
            .eq("id", gameId)
            .eq("status", "active"); // Only update if game is still active

        if (error) {
            console.error("Error handling disconnect:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in duel-disconnect:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
