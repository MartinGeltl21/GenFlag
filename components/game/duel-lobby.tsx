"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { DuelGame, getInvitationLink, startGame } from "@/lib/duelGame";
import { IconCopy, IconCheck, IconLoader2 } from "@tabler/icons-react";

interface Country {
    name: { common: string };
    cca2: string;
}

interface DuelLobbyProps {
    game: DuelGame;
    playerRole: "player1" | "player2";
    countries: Country[];
    onGameStart: () => void;
}

export function DuelLobby({ game, playerRole, countries, onGameStart }: DuelLobbyProps) {
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isStarting, setIsStarting] = useState(false);

    const inviteLink = getInvitationLink(game.id);

    const copyToClipboard = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }, [inviteLink]);

    // Start countdown when player2 joins
    useEffect(() => {
        if (game.player2_name && playerRole === "player1" && !isStarting) {
            setIsStarting(true);
            setCountdown(3);
        }
    }, [game.player2_name, playerRole, isStarting]);

    // Countdown and game start
    useEffect(() => {
        if (countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }

        // Countdown finished - start game
        if (countdown === 0 && playerRole === "player1" && countries.length > 0) {
            const randomCountry = countries[Math.floor(Math.random() * countries.length)];
            startGame(game.id, randomCountry.cca2).then(() => {
                onGameStart();
            });
        }
    }, [countdown, playerRole, countries, game.id, onGameStart]);

    // Player 2 just sees the countdown
    useEffect(() => {
        if (game.player2_name && playerRole === "player2" && countdown === null) {
            setCountdown(3);
        }
    }, [game.player2_name, playerRole, countdown]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
        >
            {countdown !== null && countdown > 0 ? (
                // Countdown display
                <>
                    <div className="text-6xl mb-4">⚔️</div>
                    <h2 className="text-3xl font-bold text-white">Spiel startet in...</h2>
                    <motion.div
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-9xl font-bold text-purple-400"
                    >
                        {countdown}
                    </motion.div>
                    <div className="flex items-center justify-center gap-4 text-lg text-neutral-300">
                        <span className="text-green-400">{game.player1_name}</span>
                        <span>vs</span>
                        <span className="text-blue-400">{game.player2_name}</span>
                    </div>
                </>
            ) : countdown === 0 ? (
                // Starting...
                <>
                    <IconLoader2 className="w-16 h-16 mx-auto text-purple-400 animate-spin" />
                    <h2 className="text-2xl font-bold text-white">Spiel wird gestartet...</h2>
                </>
            ) : playerRole === "player1" && !game.player2_name ? (
                // Waiting for player 2
                <>
                    <div className="text-5xl md:text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">Warte auf Gegner...</h2>
                    <p className="text-base md:text-lg text-neutral-300">
                        Teile diesen Link mit deinem Freund:
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg mx-auto px-2">
                        <div className="flex-1 px-3 py-2.5 md:px-4 md:py-3 bg-black/50 border border-white/20 rounded-lg text-white font-mono text-xs md:text-sm break-all sm:truncate">
                            {inviteLink}
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <IconCheck className="w-5 h-5 text-white" />
                                    <span className="sm:hidden text-white text-sm">Kopiert!</span>
                                </>
                            ) : (
                                <>
                                    <IconCopy className="w-5 h-5 text-white" />
                                    <span className="sm:hidden text-white text-sm">Link kopieren</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="pt-4 md:pt-6">
                        <div className="inline-flex items-center gap-2 md:gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 md:px-6 md:py-3">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm md:text-base text-white">
                                Du spielst als: <span className="text-green-400 font-semibold">{game.player1_name}</span>
                            </span>
                        </div>
                    </div>
                </>
            ) : playerRole === "player2" ? (
                // Player 2 waiting for game to start
                <>
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-3xl font-bold text-white">Beigetreten!</h2>
                    <p className="text-lg text-neutral-300">
                        Warte auf den Spielstart...
                    </p>
                    <div className="flex items-center justify-center gap-4 text-lg">
                        <span className="text-green-400">{game.player1_name}</span>
                        <span className="text-neutral-500">vs</span>
                        <span className="text-blue-400">{game.player2_name}</span>
                    </div>
                </>
            ) : null}
        </motion.div>
    );
}
