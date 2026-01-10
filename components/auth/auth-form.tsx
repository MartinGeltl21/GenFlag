"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconBrandGoogle } from "@tabler/icons-react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                // Validate username
                if (!username.trim()) {
                    throw new Error("Bitte gib einen Benutzernamen ein.");
                }
                if (username.length < 3) {
                    throw new Error("Der Benutzername muss mindestens 3 Zeichen haben.");
                }
                if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                    throw new Error("Der Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten.");
                }

                // Check if username is already taken
                const { data: existingUser } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("username", username)
                    .single();

                if (existingUser) {
                    throw new Error("Dieser Benutzername ist bereits vergeben.");
                }

                // Sign up with username in metadata
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username.trim(),
                        }
                    }
                });
                if (signUpError) throw signUpError;

                setMessage("Registrierung erfolgreich! Bitte bestätige deine E-Mail.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.refresh();
                if (onSuccess) onSuccess();
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuth = async (provider: "google" | "github") => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
        if (error) console.error(error);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                    {isSignUp ? "Registrieren" : "Anmelden"}
                </h2>
                <p className="text-zinc-400">
                    Speichere deine Fortschritte und vergleiche deine Statistik.
                </p>
            </div>

            <div className="flex flex-col gap-5">
                {!isSignUp && (
                    <Button
                        variant="outline"
                        onClick={() => handleOAuth("google")}
                        className="w-full gap-3 py-6 text-base border-white/20 bg-white/10 text-zinc-400 hover:text-white hover:bg-white/15 hover:border-white/30 transition-colors"
                    >
                        <IconBrandGoogle className="h-5 w-5" />
                        Mit Google fortfahren
                    </Button>
                )}

                {!isSignUp && (
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-950 px-4 text-zinc-500">Oder mit E-Mail</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    {isSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-zinc-300">Benutzername</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="max_mustermann"
                                className="py-6 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500"
                                required
                                minLength={3}
                            />
                            <p className="text-xs text-zinc-500">Nur Buchstaben, Zahlen und Unterstriche erlaubt.</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">E-Mail</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="py-6 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Passwort</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="py-6 pr-12 bg-zinc-900/50 border-white/10 text-white"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
                    {message && <div className="text-green-400 text-sm p-3 bg-green-500/10 rounded-lg border border-green-500/20">{message}</div>}

                    <Button type="submit" className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? "Lädt..." : isSignUp ? "Registrieren" : "Anmelden"}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-zinc-400 hover:text-white underline underline-offset-4 transition-colors"
                    >
                        {isSignUp
                            ? "Bereits einen Account? Anmelden"
                            : "Noch keinen Account? Registrieren"}
                    </button>
                </div>
            </div>
        </div>
    );
}
