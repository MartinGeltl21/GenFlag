"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { GridBackground } from "@/components/ui/grid-background";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import { motion } from "motion/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";
import { createDuelGame } from "@/lib/duelGame";

export default function DuelCreatePage() {
    const router = useRouter();
    const [playerName, setPlayerName] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setIsLoggedIn(true);
                // Try to get username from metadata
                const displayName = user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    user.email?.split("@")[0] ||
                    "Spieler";
                setPlayerName(displayName);
            }
        };

        checkAuth();
    }, []);

    const handleCreateGame = async () => {
        if (!playerName.trim()) {
            setError("Bitte gib einen Namen ein");
            return;
        }

        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { gameId, error: createError } = await createDuelGame(
            playerName.trim(),
            user?.id
        );

        if (createError) {
            setError(createError);
            setIsLoading(false);
            return;
        }

        // Store player role in sessionStorage
        sessionStorage.setItem(`duel_${gameId}_role`, "player1");
        sessionStorage.setItem(`duel_${gameId}_name`, playerName.trim());

        router.push(`/game/duel/${gameId}`);
    };

    const sidebarLinks = [
        {
            label: "Start",
            href: "/",
            icon: <IconHome className="h-6 w-6 shrink-0 text-white" />,
        },
        {
            label: "Spielen",
            href: "/game/modes",
            icon: <IconDeviceGamepad className="h-6 w-6 shrink-0 text-white" />,
        },
        {
            label: "Flaggen",
            href: "/flaggen",
            icon: <IconFlag className="h-6 w-6 shrink-0 text-white" />,
        },
        {
            label: "Über",
            href: "#about",
            icon: <IconInfoCircle className="h-6 w-6 shrink-0 text-white" />,
        },
    ];

    return (
        <div className="relative flex flex-col md:flex-row h-dvh w-full overflow-hidden dark:bg-black">
            <GridBackground className="pointer-events-none absolute inset-0" />

            <Sidebar>
                <SidebarBody className="justify-between gap-10 bg-black/60 backdrop-blur-xl border-r border-white/10">
                    <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
                        <Link href="/" className="flex items-center space-x-2 py-2">
                            <div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-medium whitespace-pre text-white text-base"
                            >
                                GenFlag
                            </motion.span>
                        </Link>
                        <div className="mt-8 flex flex-col gap-3">
                            {sidebarLinks.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <AuthModal />
                        <SidebarLink
                            link={{
                                label: "Zurück",
                                href: "/game/modes",
                                icon: <IconArrowLeft className="h-6 w-6 shrink-0 text-white" />,
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            <div className="relative z-12 flex flex-1 flex-col items-center justify-center overflow-y-auto dark:bg-black px-3 py-4 md:px-4 md:py-0">
                <div className="w-full max-w-lg mx-auto">
                    <div className="rounded-2xl border border-white/10 bg-black p-5 md:p-8 lg:p-12 backdrop-blur-xl shadow-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-5 md:space-y-8"
                        >
                            <div className="text-5xl md:text-6xl mb-2 md:mb-4">⚔️</div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">1v1 Duell</h1>
                            <p className="text-sm md:text-base text-neutral-300">
                                Fordere einen Freund heraus! Wer zuerst keine Leben mehr hat, verliert.
                            </p>

                            {/* Rules */}
                            <div className="text-left bg-black/40 rounded-xl p-3 md:p-4 border border-white/10">
                                <h3 className="text-sm md:text-base text-white font-semibold mb-2">Regeln:</h3>
                                <ul className="text-xs md:text-sm text-neutral-400 space-y-1">
                                    <li>• Jeder Spieler hat <span className="text-red-400">3 Leben</span></li>
                                    <li>• Beide sehen die gleiche Flagge</li>
                                    <li>• <span className="text-amber-400">21 Sekunden</span> Zeit pro Runde</li>
                                    <li>• Falsche Antwort oder Timeout = 1 Leben weg</li>
                                </ul>
                            </div>

                            {/* Name input */}
                            <div className="space-y-2">
                                <label className="block text-xs md:text-sm text-neutral-400 text-left">
                                    {isLoggedIn ? "Dein Anzeigename:" : "Gib deinen Namen ein:"}
                                </label>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Dein Name"
                                    maxLength={20}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm">{error}</p>
                            )}

                            {/* Create button */}
                            <button
                                onClick={handleCreateGame}
                                disabled={isLoading || !playerName.trim()}
                                className={cn(
                                    "w-full py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all",
                                    isLoading || !playerName.trim()
                                        ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                                )}
                            >
                                {isLoading ? "Wird erstellt..." : "Duell erstellen"}
                            </button>

                            {!isLoggedIn && (
                                <p className="text-xs text-neutral-500">
                                    💡 Tipp: Melde dich an, um deine Statistiken zu speichern!
                                </p>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
