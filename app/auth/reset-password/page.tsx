"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Die Passwörter stimmen nicht überein.");
            setIsLoading(false);
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setMessage("Passwort erfolgreich geändert! Du wirst weitergeleitet...");

            // Redirect to home page after 2 seconds
            setTimeout(() => {
                router.push("/");
                router.refresh();
            }, 2000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Neues Passwort festlegen
                    </h1>
                    <p className="text-zinc-400">
                        Gib dein neues Passwort ein.
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Neues Passwort</Label>
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

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-zinc-300">Passwort bestätigen</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="py-6 pr-12 bg-zinc-900/50 border-white/10 text-white"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
                    {message && <div className="text-green-400 text-sm p-3 bg-green-500/10 rounded-lg border border-green-500/20">{message}</div>}

                    <Button type="submit" className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                        {isLoading ? "Lädt..." : "Passwort ändern"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
