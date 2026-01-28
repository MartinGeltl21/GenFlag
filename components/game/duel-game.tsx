"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { getGermanName } from "@/lib/countryNames";
import { getSimilarFlags } from "@/lib/similarFlags";
import { DuelGame, submitAnswer, processRoundResults, nextRound, PlayerRole } from "@/lib/duelGame";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

interface Country {
    name: { common: string };
    flags: { svg?: string; png?: string };
    cca2: string;
}

interface DuelGameComponentProps {
    game: DuelGame;
    playerRole: PlayerRole;
    countries: Country[];
    onGameEnd: () => void;
}

const ROUND_TIME = 21; // seconds

export function DuelGameComponent({ game, playerRole, countries, onGameEnd }: DuelGameComponentProps) {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; answer: string } | null>(null);
    const [showRoundResult, setShowRoundResult] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const roundProcessedRef = useRef(false);

    // Get current country from flag code
    const currentCountry = useMemo(() => {
        return countries.find(c => c.cca2 === game.current_flag_code) || null;
    }, [countries, game.current_flag_code]);

    const correctAnswer = useMemo(() => {
        return currentCountry ? getGermanName(currentCountry.name.common) : "";
    }, [currentCountry]);

    // Get all German country names for autocomplete
    const allGermanNames = useMemo(() => {
        return countries.map((c) => getGermanName(c.name.common)).sort((a, b) => a.localeCompare(b, "de"));
    }, [countries]);

    // Filter suggestions based on input
    const suggestions = useMemo(() => {
        if (inputValue.length < 1) return [];
        const lowerInput = inputValue.toLowerCase();
        return allGermanNames.filter((name) => name.toLowerCase().includes(lowerInput)).slice(0, 6);
    }, [inputValue, allGermanNames]);

    // My answer state from game
    const myAnswered = playerRole === "player1" ? game.player1_answered : game.player2_answered;
    const opponentAnswered = playerRole === "player1" ? game.player2_answered : game.player1_answered;
    const myLives = playerRole === "player1" ? game.player1_lives : game.player2_lives;
    const opponentLives = playerRole === "player1" ? game.player2_lives : game.player1_lives;
    const myName = playerRole === "player1" ? game.player1_name : game.player2_name;
    const opponentName = playerRole === "player1" ? game.player2_name : game.player1_name;

    // Timer logic
    useEffect(() => {
        if (game.status !== "active" || hasAnswered) return;

        // Calculate time left based on round_start_time
        const startTime = game.round_start_time ? new Date(game.round_start_time).getTime() : Date.now();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, ROUND_TIME - elapsed);
        setTimeLeft(remaining);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up - submit empty answer
                    if (!hasAnswered) {
                        handleTimeout();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game.round_number, game.status, hasAnswered]);

    // Handle timeout
    const handleTimeout = useCallback(async () => {
        if (hasAnswered) return;
        setHasAnswered(true);
        setLastAnswer({ correct: false, answer: "" });
        await submitAnswer(game.id, playerRole, false);
    }, [game.id, playerRole, hasAnswered]);

    // Reset state when round changes
    useEffect(() => {
        setInputValue("");
        setHasAnswered(false);
        setLastAnswer(null);
        setShowRoundResult(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        roundProcessedRef.current = false;
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [game.round_number]);

    // Process round results when both have answered
    useEffect(() => {
        if (game.player1_answered && game.player2_answered && !roundProcessedRef.current) {
            roundProcessedRef.current = true;
            setShowRoundResult(true);

            // Only player1 processes the results to avoid race conditions
            if (playerRole === "player1") {
                setTimeout(async () => {
                    const { finished } = await processRoundResults(game.id, game);

                    if (!finished) {
                        // Start next round with new flag
                        const availableCountries = countries.filter(c => c.cca2 !== game.current_flag_code);
                        const randomCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
                        await nextRound(game.id, randomCountry.cca2, game.round_number);
                    }
                }, 2000);
            }
        }
    }, [game, playerRole, countries]);

    // Check for game end
    useEffect(() => {
        if (game.status === "finished") {
            onGameEnd();
        }
    }, [game.status, onGameEnd]);

    const handleSubmit = async (answer: string) => {
        if (hasAnswered || game.status !== "active") return;

        const normalizedAnswer = answer.trim().toLowerCase();

        // Check similar flags
        const similarNames = getSimilarFlags(currentCountry?.name.common || "").map(getGermanName);
        const allCorrectAnswers = [correctAnswer, ...similarNames].map(name => name.toLowerCase());

        const isCorrect = allCorrectAnswers.includes(normalizedAnswer);

        setHasAnswered(true);
        setLastAnswer({ correct: isCorrect, answer: answer.trim() });
        setShowSuggestions(false);

        await submitAnswer(game.id, playerRole, isCorrect);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        handleSubmit(suggestion);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Tab to autocomplete
        if (e.key === "Tab" && suggestions.length > 0) {
            e.preventDefault();
            const suggestionToUse = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
            setInputValue(suggestionToUse);
            setShowSuggestions(false);
            setSelectedIndex(-1);
            return;
        }

        // Enter to submit
        if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault();
            handleSubmit(inputValue);
            return;
        }

        // Navigation in suggestions
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => prev < suggestions.length - 1 ? prev + 1 : 0);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => prev > 0 ? prev - 1 : suggestions.length - 1);
                return;
            }
        }
    };

    const renderLives = (lives: number, maxLives: number = 3) => {
        return (
            <div className="flex gap-1">
                {Array.from({ length: maxLives }).map((_, i) => (
                    i < lives ? (
                        <IconHeartFilled key={i} className="w-5 h-5 text-red-500" />
                    ) : (
                        <IconHeart key={i} className="w-5 h-5 text-neutral-600" />
                    )
                ))}
            </div>
        );
    };

    if (!currentCountry) {
        return (
            <div className="text-center text-white">
                <p>Lädt Flagge...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 md:space-y-8"
        >
            {/* Mobile Layout: Timer + Both Players in a row */}
            <div className="md:hidden space-y-3">
                {/* Timer centered on top */}
                <div className="flex justify-center">
                    <div className={cn(
                        "flex flex-col items-center justify-center w-14 h-14 rounded-full border-4",
                        timeLeft <= 5 ? "border-red-500 bg-red-500/20" :
                            timeLeft <= 10 ? "border-yellow-500 bg-yellow-500/20" :
                                "border-purple-500 bg-purple-500/20"
                    )}>
                        <span className={cn(
                            "text-lg font-bold leading-none",
                            timeLeft <= 5 ? "text-red-400" :
                                timeLeft <= 10 ? "text-yellow-400" :
                                    "text-purple-400"
                        )}>
                            {timeLeft}
                        </span>
                        <span className="text-[9px] text-neutral-500">Sek</span>
                    </div>
                </div>

                {/* Both players in a symmetric row */}
                <div className="grid grid-cols-2 gap-2 px-1">
                    {/* Player 1 (Me) */}
                    <div className={cn(
                        "p-2.5 rounded-xl border",
                        playerRole === "player1"
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-blue-500/50 bg-blue-500/10"
                    )}>
                        <div className="flex flex-col items-center text-center gap-1">
                            <p className="text-[10px] text-neutral-400">Du</p>
                            <p className={cn(
                                "font-bold text-sm truncate w-full",
                                playerRole === "player1" ? "text-green-400" : "text-blue-400"
                            )}>
                                {myName}
                            </p>
                            <div className="flex items-center gap-0.5">
                                {renderLives(myLives)}
                                {hasAnswered && (
                                    <span className="text-xs text-green-500 ml-1">✓</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Player 2 (Opponent) */}
                    <div className={cn(
                        "p-2.5 rounded-xl border",
                        playerRole === "player2"
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-blue-500/50 bg-blue-500/10"
                    )}>
                        <div className="flex flex-col items-center text-center gap-1">
                            <p className="text-[10px] text-neutral-400">Gegner</p>
                            <p className={cn(
                                "font-bold text-sm truncate w-full",
                                playerRole === "player2" ? "text-green-400" : "text-blue-400"
                            )}>
                                {opponentName}
                            </p>
                            <div className="flex items-center gap-0.5">
                                {renderLives(opponentLives)}
                                {opponentAnswered && (
                                    <span className="text-xs text-green-500 ml-1">✓</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout: Players with Timer between them */}
            <div className="hidden md:flex items-center justify-between gap-4">
                {/* Player 1 (Me) */}
                <div className={cn(
                    "flex-1 p-4 rounded-xl border",
                    playerRole === "player1"
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-blue-500/50 bg-blue-500/10"
                )}>
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-neutral-400">Du</p>
                            <p className={cn(
                                "font-bold text-base truncate",
                                playerRole === "player1" ? "text-green-400" : "text-blue-400"
                            )}>
                                {myName}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {renderLives(myLives)}
                            {hasAnswered && (
                                <span className="text-xs text-green-500">✓</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Timer */}
                <div className={cn(
                    "flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 shrink-0",
                    timeLeft <= 5 ? "border-red-500 bg-red-500/20" :
                        timeLeft <= 10 ? "border-yellow-500 bg-yellow-500/20" :
                            "border-purple-500 bg-purple-500/20"
                )}>
                    <span className={cn(
                        "text-2xl font-bold",
                        timeLeft <= 5 ? "text-red-400" :
                            timeLeft <= 10 ? "text-yellow-400" :
                                "text-purple-400"
                    )}>
                        {timeLeft}
                    </span>
                    <span className="text-xs text-neutral-500">Sek</span>
                </div>

                {/* Player 2 (Opponent) */}
                <div className={cn(
                    "flex-1 p-4 rounded-xl border",
                    playerRole === "player2"
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-blue-500/50 bg-blue-500/10"
                )}>
                    <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-neutral-400">Gegner</p>
                            <p className={cn(
                                "font-bold text-base truncate",
                                playerRole === "player2" ? "text-green-400" : "text-blue-400"
                            )}>
                                {opponentName}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {renderLives(opponentLives)}
                            {opponentAnswered && (
                                <span className="text-xs text-green-500">✓</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Round indicator */}
            <div className="text-center">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-black/40 border border-white/10 text-xs md:text-sm text-neutral-300">
                    ⚔️ Runde {game.round_number}
                </span>
            </div>

            {/* Flag */}
            <div className="flex items-center justify-center px-2">
                <div className="relative w-full max-w-xs md:max-w-md aspect-[3/2] flex items-center justify-center">
                    <img
                        src={currentCountry.flags?.svg || currentCountry.flags?.png || ""}
                        alt="Flagge"
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Input Field */}
            <div className="relative max-w-md mx-auto px-2 md:px-0">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setShowSuggestions(e.target.value.length >= 1);
                            setSelectedIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(inputValue.length >= 1)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Ländername eingeben..."
                        disabled={hasAnswered}
                        className={cn(
                            "w-full px-4 py-3 md:px-6 md:py-4 text-base md:text-lg rounded-xl border-2 bg-black/50 text-white placeholder-neutral-500 focus:outline-none transition-colors",
                            hasAnswered && lastAnswer?.correct
                                ? "border-green-500 bg-green-500/10"
                                : hasAnswered && !lastAnswer?.correct
                                    ? "border-red-500 bg-red-500/10"
                                    : "border-white/20 focus:border-purple-500"
                        )}
                    />
                    {!hasAnswered && inputValue.trim() && (
                        <button
                            onClick={() => handleSubmit(inputValue)}
                            className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base rounded-lg font-medium transition-colors"
                        >
                            Prüfen
                        </button>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && !hasAnswered && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 rounded-xl border border-white/10 bg-black/95 backdrop-blur-xl overflow-hidden shadow-2xl"
                        >
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onMouseDown={() => handleSuggestionClick(suggestion)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={cn(
                                        "w-full px-4 py-2.5 md:py-3 text-left text-sm md:text-base text-white transition-colors border-b border-white/5 last:border-b-0",
                                        selectedIndex === index
                                            ? "bg-purple-600/30 text-purple-200"
                                            : "hover:bg-white/10"
                                    )}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Answer Result */}
            <AnimatePresence>
                {hasAnswered && lastAnswer && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center px-2"
                    >
                        {lastAnswer.correct ? (
                            <p className="text-xl md:text-2xl font-bold text-green-400">✓ Richtig!</p>
                        ) : lastAnswer.answer ? (
                            <p className="text-base md:text-xl text-red-400">
                                ✗ Falsch! Richtig war: <span className="font-bold text-white">{correctAnswer}</span>
                            </p>
                        ) : (
                            <p className="text-base md:text-xl text-amber-400">
                                ⏰ Zeit abgelaufen! Es war: <span className="font-bold text-white">{correctAnswer}</span>
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Round Result */}
            <AnimatePresence>
                {showRoundResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-3 md:p-4 mx-2 md:mx-0 rounded-xl bg-black/60 border border-white/10"
                    >
                        <p className="text-sm md:text-base text-neutral-400">Warte auf nächste Runde...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
