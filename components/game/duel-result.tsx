"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { DuelGame, PlayerRole } from "@/lib/duelGame";

interface DuelResultProps {
    game: DuelGame;
    playerRole: PlayerRole;
    onRematch: () => void;
}

export function DuelResult({ game, playerRole, onRematch }: DuelResultProps) {
    const isWinner = game.winner === playerRole;
    const isDraw = game.winner === null;

    const myName = playerRole === "player1" ? game.player1_name : game.player2_name;
    const opponentName = playerRole === "player1" ? game.player2_name : game.player1_name;
    const myLives = playerRole === "player1" ? game.player1_lives : game.player2_lives;
    const opponentLives = playerRole === "player1" ? game.player2_lives : game.player1_lives;
    const opponentConnected = playerRole === "player1" ? game.player2_connected : game.player1_connected;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 md:space-y-8 px-2 md:px-0"
        >
            {/* Result emoji and title */}
            <div className="text-5xl md:text-6xl mb-2 md:mb-4">
                {isDraw ? "🤝" : isWinner ? "🏆" : "😢"}
            </div>

            <h2 className="text-2xl md:text-4xl font-bold text-white">
                {isDraw ? "Unentschieden!" : isWinner ? "Du hast gewonnen!" : "Du hast verloren!"}
            </h2>

            {/* Disconnect message */}
            {!opponentConnected && (
                <p className="text-sm md:text-base text-amber-400">
                    {opponentName} hat die Verbindung verloren
                </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-md mx-auto">
                <div className={`p-4 md:p-6 rounded-xl border ${isWinner ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}`}>
                    <p className="text-xs md:text-sm text-neutral-400 mb-1">Du</p>
                    <p className={`text-base md:text-xl font-bold truncate ${isWinner ? "text-green-400" : "text-red-400"}`}>
                        {myName}
                    </p>
                    <p className="text-2xl md:text-3xl mt-2">
                        {"❤️".repeat(myLives)}{"🖤".repeat(3 - myLives)}
                    </p>
                </div>

                <div className={`p-4 md:p-6 rounded-xl border ${!isWinner && !isDraw ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}`}>
                    <p className="text-xs md:text-sm text-neutral-400 mb-1">Gegner</p>
                    <p className={`text-base md:text-xl font-bold truncate ${!isWinner && !isDraw ? "text-green-400" : "text-red-400"}`}>
                        {opponentName}
                    </p>
                    <p className="text-2xl md:text-3xl mt-2">
                        {"❤️".repeat(opponentLives)}{"🖤".repeat(3 - opponentLives)}
                    </p>
                </div>
            </div>

            {/* Round count */}
            <p className="text-base md:text-lg text-neutral-300">
                Gespielt: <span className="text-purple-400 font-bold">{game.round_number}</span> Runden
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 md:gap-4 justify-center pt-2 md:pt-4">
                <button
                    onClick={onRematch}
                    className="text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-base md:text-lg px-6 py-3 md:px-8 md:py-4 shadow-lg shadow-purple-500/20 transition-all"
                >
                    🔄 Revanche
                </button>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Link
                        href="/game/duel"
                        className="flex-1 text-center text-white bg-zinc-700 hover:bg-zinc-600 focus:ring-4 focus:ring-zinc-500 font-medium rounded-lg text-base md:text-lg px-6 py-3 md:px-8 md:py-4 transition-colors"
                    >
                        Neues Duell
                    </Link>
                    <Link
                        href="/game/modes"
                        className="flex-1 text-center text-white bg-zinc-700 hover:bg-zinc-600 focus:ring-4 focus:ring-zinc-500 font-medium rounded-lg text-base md:text-lg px-6 py-3 md:px-8 md:py-4 transition-colors"
                    >
                        Zurück
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
