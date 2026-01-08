"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconBrandGoogle, IconUser, IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";

export function AuthModal({ onLogin }: { onLogin?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    // Try to get the sidebar context, but don't fail if we're not inside a Sidebar
    let sidebarContext: { open: boolean; animate: boolean } | null = null;
    try {
        sidebarContext = useSidebar();
    } catch {
        // Not inside a SidebarProvider, use default values
    }
    const open = sidebarContext?.open ?? true;
    const animate = sidebarContext?.animate ?? false;

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage("Registrierung erfolgreich! Bitte bestätige deine E-Mail.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                setIsOpen(false);
                router.refresh();
                if (onLogin) onLogin();
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    // If user is logged in, show profile link + logout
    if (user) {
        return (
            <div className="flex flex-col gap-1">
                <Link
                    href="/profile"
                    className="flex items-center justify-start gap-3 group/sidebar py-3"
                >
                    <IconUser className="h-6 w-6 shrink-0 text-white" />
                    <motion.span
                        animate={{
                            display: animate ? (open ? "inline-block" : "none") : "inline-block",
                            opacity: animate ? (open ? 1 : 0) : 1,
                        }}
                        className="text-white text-base font-medium group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                    >
                        Profil
                    </motion.span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-start gap-3 group/sidebar py-3"
                >
                    <IconLogout className="h-6 w-6 shrink-0 text-white" />
                    <motion.span
                        animate={{
                            display: animate ? (open ? "inline-block" : "none") : "inline-block",
                            opacity: animate ? (open ? 1 : 0) : 1,
                        }}
                        className="text-white text-base font-medium group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                    >
                        Abmelden
                    </motion.span>
                </button>
            </div>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center justify-start gap-3 group/sidebar py-3 w-full text-left">
                    <IconUser className="h-6 w-6 shrink-0 text-white" />
                    <motion.span
                        animate={{
                            display: animate ? (open ? "inline-block" : "none") : "inline-block",
                            opacity: animate ? (open ? 1 : 0) : 1,
                        }}
                        className="text-white text-base font-medium group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
                    >
                        Anmelden
                    </motion.span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>{isSignUp ? "Registrieren" : "Anmelden"}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Speichere deine Fortschritte und vergleiche deine Statistik.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <Button
                        variant="outline"
                        onClick={() => handleOAuth("google")}
                        className="w-full gap-2 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white"
                    >
                        <IconBrandGoogle className="h-4 w-4" />
                        Mit Google fortfahren
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-950 px-2 text-zinc-500">Oder mit E-Mail</span>
                        </div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-Mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="bg-black/50 border-white/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Passwort</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black/50 border-white/10"
                                required
                                minLength={6}
                            />
                        </div>

                        {error && <div className="text-red-400 text-sm">{error}</div>}
                        {message && <div className="text-green-400 text-sm">{message}</div>}

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                            {isLoading ? "Lädt..." : isSignUp ? "Registrieren" : "Anmelden"}
                        </Button>
                    </form>

                    <div className="mt-2 text-center text-sm">
                        <button
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-zinc-400 hover:text-white underline underline-offset-4"
                        >
                            {isSignUp
                                ? "Bereits einen Account? Anmelden"
                                : "Noch keinen Account? Registrieren"}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
