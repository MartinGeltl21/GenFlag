import { createClient } from "@/lib/supabase/client";

export interface FlagStats {
    country_code: string;
    times_correct: number;
    times_wrong: number;
}

export async function saveFlagResult(countryCode: string, isCorrect: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return; // Not logged in, do nothing

    // Upsert: Try to insert, if exists, update
    // We need to fetch first to know current values or use a custom SQL function/RPC for atomic increment.
    // For simplicity in this non-critical app, we'll fetch then update or insert.
    // Better approach with unique constraint:
    // Insert on conflict do update.

    // First, try to get existing record
    const { data: existing } = await supabase
        .from('flag_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('country_code', countryCode)
        .single();

    if (existing) {
        await supabase
            .from('flag_stats')
            .update({
                times_correct: existing.times_correct + (isCorrect ? 1 : 0),
                times_wrong: existing.times_wrong + (isCorrect ? 0 : 1),
                last_played_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('flag_stats')
            .insert({
                user_id: user.id,
                country_code: countryCode,
                times_correct: isCorrect ? 1 : 0,
                times_wrong: isCorrect ? 0 : 1,
            });
    }
}

export async function getUserStats() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
        .from('flag_stats')
        .select('*')
        .eq('user_id', user.id);

    return data || [];
}
