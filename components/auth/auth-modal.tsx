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
import { AuthForm } from "@/components/auth/auth-form";

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
                {/* Wir rendern hier einfach die AuthForm, damit wir keine doppelte Logik haben */}
                <div className="py-4">
                    <AuthForm />
                </div>
            </DialogContent>
        </Dialog>
    );
}
