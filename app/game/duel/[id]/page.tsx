"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { GridBackground } from "@/components/ui/grid-background";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";
import {
    DuelGame,
    PlayerRole,
    getDuelGame,
    joinDuelGame,
    subscribeToGame,
    unsubscribeFromGame,
    handleDisconnect,
    createDuelGame,
    getInvitationLink
} from "@/lib/duelGame";
import { DuelLobby } from "@/components/game/duel-lobby";
import { DuelGameComponent } from "@/components/game/duel-game";
import { DuelResult } from "@/components/game/duel-result";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Country {
    name: { common: string };
    flags: { svg?: string; png?: string };
    cca2: string;
}

export default function DuelGamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: gameId } = use(params);
    const router = useRouter();
    const [game, setGame] = useState<DuelGame | null>(null);
    const [playerRole, setPlayerRole] = useState<PlayerRole | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [playerName, setPlayerName] = useState("");
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // Fetch countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await fetch("https://restcountries.com/v3.1/all?fields=flags,name,cca2", {
                    cache: "force-cache",
                    headers: { Accept: "application/json" },
                });
                const data: Country[] = await res.json();
                setCountries(data);
            } catch (e) {
                console.error("Fehler beim Laden der Länder:", e);
            }
        };

        fetchCountries();
    }, []);

    // Initialize game
    useEffect(() => {
        const initGame = async () => {
            setIsLoading(true);

            // Check if we're the creator (player1)
            const storedRole = sessionStorage.getItem(`duel_${gameId}_role`) as PlayerRole | null;
            const storedName = sessionStorage.getItem(`duel_${gameId}_name`);

            const { game: fetchedGame, error: fetchError } = await getDuelGame(gameId);

            if (fetchError || !fetchedGame) {
                setError("Spiel nicht gefunden");
                setIsLoading(false);
                return;
            }

            setGame(fetchedGame);

            if (storedRole === "player1") {
                setPlayerRole("player1");
                setIsLoading(false);
            } else if (fetchedGame.player2_name && storedRole === "player2") {
                // We already joined
                setPlayerRole("player2");
                setIsLoading(false);
            } else if (!fetchedGame.player2_name) {
                // Need to join
                setShowJoinForm(true);
                setIsLoading(false);

                // Pre-fill name if logged in
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const displayName = user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        user.email?.split("@")[0] ||
                        "Spieler 2";
                    setPlayerName(displayName);
                }
            } else {
                // Game is full and we're not a player
                setError("Dieses Spiel ist bereits voll");
                setIsLoading(false);
            }
        };

        if (gameId) {
            initGame();
        }
    }, [gameId]);

    // Subscribe to game updates
    useEffect(() => {
        if (!game || !playerRole) return;

        const newChannel = subscribeToGame(gameId, (updatedGame) => {
            setGame(updatedGame);
        });

        setChannel(newChannel);

        return () => {
            if (newChannel) {
                unsubscribeFromGame(newChannel);
            }
        };
    }, [gameId, game?.id, playerRole]);

    // Handle page unload - mark player as disconnected
    useEffect(() => {
        if (!game || !playerRole || game.status === "finished") return;

        const handleUnload = () => {
            // Use sendBeacon for reliable delivery
            const data = JSON.stringify({
                gameId: game.id,
                playerRole,
            });
            navigator.sendBeacon("/api/duel-disconnect", data);
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, [game, playerRole]);

    const handleJoin = async () => {
        if (!playerName.trim()) {
            setError("Bitte gib einen Namen ein");
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { success, error: joinError, game: joinedGame } = await joinDuelGame(
            gameId,
            playerName.trim(),
            user?.id
        );

        if (!success || joinError) {
            setError(joinError || "Fehler beim Beitreten");
            return;
        }

        sessionStorage.setItem(`duel_${gameId}_role`, "player2");
        sessionStorage.setItem(`duel_${gameId}_name`, playerName.trim());

        setPlayerRole("player2");
        setShowJoinForm(false);
        if (joinedGame) {
            setGame(joinedGame);
        }
    };

    const handleGameStart = useCallback(() => {
        // Game will update via subscription
    }, []);

    const handleGameEnd = useCallback(() => {
        // Game will update via subscription
    }, []);

    const handleRematch = useCallback(async () => {
        if (!playerRole || !game) return;

        const myName = playerRole === "player1" ? game.player1_name : game.player2_name;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Create new game
        const { gameId: newGameId, error: createError } = await createDuelGame(
            myName || "Spieler",
            user?.id
        );

        if (createError || !newGameId) return;

        // Store role and navigate
        sessionStorage.setItem(`duel_${newGameId}_role`, "player1");
        sessionStorage.setItem(`duel_${newGameId}_name`, myName || "Spieler");

        // Copy invite link to clipboard
        const inviteLink = getInvitationLink(newGameId);
        navigator.clipboard.writeText(inviteLink);

        router.push(`/game/duel/${newGameId}`);
    }, [game, playerRole, router]);

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

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center text-white">
                    <div className="text-4xl mb-4">⏳</div>
                    <p>Lädt...</p>
                </div>
            );
        }

        if (error) {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-6"
                >
                    <div className="text-6xl">❌</div>
                    <h2 className="text-2xl font-bold text-white">{error}</h2>
                    <Link
                        href="/game/duel"
                        className="inline-block text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-lg px-6 py-3 transition-colors"
                    >
                        Neues Duell erstellen
                    </Link>
                </motion.div>
            );
        }

        if (showJoinForm) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-5 md:space-y-8 px-2 md:px-0"
                >
                    <div className="text-5xl md:text-6xl mb-2 md:mb-4">⚔️</div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">Duell beitreten</h2>
                    <p className="text-sm md:text-base text-neutral-300">
                        {game?.player1_name} fordert dich heraus!
                    </p>

                    <div className="space-y-2 max-w-sm mx-auto">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Dein Name"
                            maxLength={20}
                            className="w-full px-4 py-3 rounded-xl border-2 border-white/20 bg-black/50 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleJoin}
                        disabled={!playerName.trim()}
                        className="px-6 py-3 md:px-8 md:py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white text-base md:text-lg font-semibold rounded-xl transition-colors"
                    >
                        Beitreten
                    </button>
                </motion.div>
            );
        }

        if (!game || !playerRole) {
            return (
                <div className="text-center text-white">
                    <p>Lädt Spielstatus...</p>
                </div>
            );
        }

        // Render based on game status
        return (
            <AnimatePresence mode="wait">
                {game.status === "waiting" && (
                    <DuelLobby
                        key="lobby"
                        game={game}
                        playerRole={playerRole}
                        countries={countries}
                        onGameStart={handleGameStart}
                    />
                )}
                {game.status === "active" && (
                    <DuelGameComponent
                        key="game"
                        game={game}
                        playerRole={playerRole}
                        countries={countries}
                        onGameEnd={handleGameEnd}
                    />
                )}
                {game.status === "finished" && (
                    <DuelResult
                        key="result"
                        game={game}
                        playerRole={playerRole}
                        onRematch={handleRematch}
                    />
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto md:flex-row dark:bg-black">
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

            <div className="relative z-10 flex flex-1 flex-col items-center justify-start overflow-y-auto dark:bg-black px-2 py-3 md:justify-center md:px-4 md:py-0">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="rounded-2xl border border-white/10 bg-black p-4 md:p-8 lg:p-12 backdrop-blur-xl shadow-2xl">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
