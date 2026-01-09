import { createClient } from "@/lib/supabase/client";

export interface FlagStats {
    country_code: string;
    times_correct: number;
    times_wrong: number;
}

export async function saveFlagResult(countryCode: string, isCorrect: boolean) {
    const supabase = createClient();

    // Use the RPC function we created for atomic updates
    // This prevents race conditions and makes the operation faster
    const { error } = await supabase.rpc('update_flag_stats', {
        p_country_code: countryCode,
        p_is_correct: isCorrect
    });

    if (error) {
        console.error("Error saving stats:", error);
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
