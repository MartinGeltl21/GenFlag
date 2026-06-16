import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation callback (Issue #17).
 *
 * Supabase redirects here with a `code` query parameter after a successful
 * Google sign-in (or email confirmation). We exchange that code for a session
 * cookie and then send the user back into the app.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // Where to send the user after a successful login.
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
        console.error("OAuth callback error:", error.message);
        return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error.message)}`);
    }

    // No code present – nothing to exchange.
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
}
