"use client";

import { useEffect, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad, IconTrophy, IconMedal, IconHeart, IconBrain } from "@tabler/icons-react";
import { AuthModal } from "@/components/auth/auth-modal";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HighscoreEntry {
    id: string;
    username: string;
    score: number;
    created_at: string;
}

type GameMode = "survival" | "expert";

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

export default function HighscorePage() {
    const [highscores, setHighscores] = useState<HighscoreEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [gameMode, setGameMode] = useState<GameMode>("survival");

    useEffect(() => {
        const fetchHighscores = async () => {
            setLoading(true);
            const supabase = createClient();
            const { data, error } = await supabase
                .from("highscores")
                .select("id, score, created_at, game_mode, profiles(username)")
                .eq("game_mode", gameMode)
                .order("score", { ascending: false })
                .limit(100); // Fetch more to allow deduplication

            if (error) {
                console.error("Error fetching highscores:", error);
                setLoading(false);
                return;
            }

            // Map the data to include the username
            const mapped = (data || []).map((entry: any) => ({
                id: entry.id,
                username: entry.profiles?.username || "Anonym",
                score: entry.score,
                created_at: entry.created_at,
            }));

            // Deduplicate: keep only best score per player (first occurrence since already sorted by score desc)
            const seen = new Set<string>();
            const deduplicated = mapped.filter((entry) => {
                if (seen.has(entry.username)) {
                    return false;
                }
                seen.add(entry.username);
                return true;
            });

            // Limit to top 10
            setHighscores(deduplicated.slice(0, 10));
            setLoading(false);
        };

        fetchHighscores();
    }, [gameMode]);

    const getMedalIcon = (index: number) => {
        if (index === 0) return <span className="text-2xl">🥇</span>;
        if (index === 1) return <span className="text-2xl">🥈</span>;
        if (index === 2) return <span className="text-2xl">🥉</span>;
        return <span className="text-lg text-zinc-500 font-bold w-8 text-center">{index + 1}</span>;
    };

    const getModeInfo = (mode: GameMode) => {
        if (mode === "survival") {
            return {
                label: "Überleben",
                icon: <IconHeart className="w-5 h-5" />,
                color: "text-red-400",
                bgActive: "bg-red-500/20 border-red-500/50",
                link: "/game/survival",
            };
        }
        return {
            label: "Experte",
            icon: <IconBrain className="w-5 h-5" />,
            color: "text-purple-400",
            bgActive: "bg-purple-500/20 border-purple-500/50",
            link: "/game/expert",
        };
    };

    const currentModeInfo = getModeInfo(gameMode);

    return (
        <div className="relative flex flex-col md:flex-row h-dvh w-full overflow-hidden bg-zinc-950">
            {/* Simple Noise Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <Sidebar>
                <SidebarBody className="justify-between gap-10 bg-black/40 backdrop-blur-xl border-r border-white/5">
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
                                href: "/profile",
                                icon: <IconArrowLeft className="h-6 w-6 shrink-0 text-white" />,
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            <div className="relative z-12 flex flex-1 flex-col overflow-y-auto w-full p-6 md:p-12">
                <div className="max-w-4xl mx-auto w-full space-y-8 pb-24">

                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center gap-3 mb-4">
                            <IconTrophy className="w-12 h-12 text-amber-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Bestenliste</h1>
                        <p className="text-zinc-400 text-lg">Die besten Spieler</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center gap-1 p-1 bg-zinc-900/60 border border-white/10 rounded-full">
                            <button
                                onClick={() => setGameMode("survival")}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all",
                                    gameMode === "survival"
                                        ? "bg-red-500/20 border border-red-500/50 text-red-400"
                                        : "text-zinc-400 hover:text-white border border-transparent"
                                )}
                            >
                                <IconHeart className="w-4 h-4" />
                                Überleben
                            </button>
                            <button
                                onClick={() => setGameMode("expert")}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all",
                                    gameMode === "expert"
                                        ? "bg-purple-500/20 border border-purple-500/50 text-purple-400"
                                        : "text-zinc-400 hover:text-white border border-transparent"
                                )}
                            >
                                <IconBrain className="w-4 h-4" />
                                Experte
                            </button>
                        </div>
                    </div>

                    {/* Highscore Table */}
                    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center h-64 text-white">
                                <div className="text-xl animate-pulse">Lade Bestenliste...</div>
                            </div>
                        ) : highscores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                                <IconMedal className="w-16 h-16 mb-4 opacity-30" />
                                <p className="text-lg">Noch keine Highscores vorhanden.</p>
                                <p className="text-sm">Sei der Erste!</p>
                                <Link
                                    href={currentModeInfo.link}
                                    className={cn(
                                        "mt-6 px-6 py-3 rounded-full text-white font-medium hover:opacity-90 transition-opacity",
                                        gameMode === "survival"
                                            ? "bg-gradient-to-r from-red-500 to-pink-500"
                                            : "bg-gradient-to-r from-purple-500 to-indigo-500"
                                    )}
                                >
                                    {currentModeInfo.label} spielen
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {/* Header Row */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-zinc-500 text-sm font-medium bg-black/20">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-7">Spieler</div>
                                    <div className="col-span-4 text-right">Punkte</div>
                                </div>

                                {/* Data Rows */}
                                {highscores.map((entry, index) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${index < 3 ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : 'hover:bg-white/5'} transition-colors`}
                                    >
                                        <div className="col-span-1 flex items-center">
                                            {getMedalIcon(index)}
                                        </div>
                                        <div className="col-span-7">
                                            <span className={`font-medium ${index < 3 ? 'text-white' : 'text-zinc-300'}`}>
                                                {entry.username}
                                            </span>
                                        </div>
                                        <div className="col-span-4 text-right">
                                            <span className={`font-bold text-lg ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-300' : index === 2 ? 'text-amber-600' : 'text-zinc-400'}`}>
                                                {entry.score}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-center text-zinc-500 text-sm">
                        Spiele den <Link href={currentModeInfo.link} className={cn("hover:underline", currentModeInfo.color)}>{currentModeInfo.label}-Modus</Link>, um auf die Bestenliste zu kommen!
                    </div>
                </div>
            </div>
        </div>
    );
}
