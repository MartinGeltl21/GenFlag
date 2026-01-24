"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { GridBackground } from "@/components/ui/grid-background";
import { getGermanName } from "@/lib/countryNames";
import { getSimilarFlags } from "@/lib/similarFlags";
import { saveFlagResult } from "@/lib/stats";
import { FlagHistory } from "@/lib/flagHistory";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad, IconPlayerSkipForward, IconDoorExit } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";

interface Country {
    name: { common: string; official: string };
    flags: { svg?: string; png?: string };
    cca2: string;
}

export default function ExpertPage() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [correctAnswer, setCorrectAnswer] = useState<string>("");
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isSkipped, setIsSkipped] = useState(false);
    const [score, setScore] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [gameEnded, setGameEnded] = useState(false);
    const [rank, setRank] = useState<number | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const flagHistory = useRef(new FlagHistory(40));

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

    useEffect(() => {
        if (countries.length > 0 && !currentCountry) {
            loadNewQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countries.length]);

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [suggestions]);

    const loadNewQuestion = useCallback(() => {
        if (countries.length === 0) return;

        // Filter countries to exclude those in recent history
        const availableCountries = countries.filter((c: Country) => flagHistory.current.canShowFlag(c.cca2));

        // If we've exhausted all countries, reset history
        if (availableCountries.length === 0) {
            flagHistory.current.reset();
            return loadNewQuestion();
        }

        const randomCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];

        // Add to history
        flagHistory.current.addFlag(randomCountry.cca2);

        const correctGermanName = getGermanName(randomCountry.name.common);

        setCurrentCountry(randomCountry);
        setCorrectAnswer(correctGermanName);
        setInputValue("");
        setIsAnswered(false);
        setIsCorrect(false);
        setIsSkipped(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);

        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [countries]);

    // Global Enter listener when answered (for manual skip to next question)
    useEffect(() => {
        const handleGlobalEnter = (e: KeyboardEvent) => {
            if (isAnswered && e.key === "Enter") {
                e.preventDefault();
                // Clear the auto-advance timer
                if (autoAdvanceTimerRef.current) {
                    clearTimeout(autoAdvanceTimerRef.current);
                    autoAdvanceTimerRef.current = null;
                }
                loadNewQuestion();
            }
        };

        if (isAnswered) {
            window.addEventListener("keydown", handleGlobalEnter);
        }

        return () => {
            window.removeEventListener("keydown", handleGlobalEnter);
        };
    }, [isAnswered, loadNewQuestion]);

    const handleSubmit = (answer: string) => {
        if (isAnswered) return;

        const normalizedAnswer = answer.trim().toLowerCase();

        // Alle als korrekt geltenden (ähnlichen) Ländernamen in Deutsch holen
        const similarNames = getSimilarFlags(currentCountry?.name.common || "").map(getGermanName);
        const allCorrectAnswers = [correctAnswer, ...similarNames].map(name => name.toLowerCase());

        const correct = allCorrectAnswers.includes(normalizedAnswer);

        setIsAnswered(true);
        setIsCorrect(correct);
        setTotal((prev) => prev + 1);
        setShowSuggestions(false);
        setSelectedIndex(-1);

        if (correct) {
            setScore((prev) => prev + 1);
        }

        saveFlagResult(currentCountry?.cca2 || "", correct);

        // Auto-advance to next question after 1 second
        autoAdvanceTimerRef.current = setTimeout(() => {
            loadNewQuestion();
        }, 1000);
    };

    const handleSkip = () => {
        if (isAnswered) return;

        setIsAnswered(true);
        setIsCorrect(false);
        setIsSkipped(true);
        setTotal((prev) => prev + 1);
        setShowSuggestions(false);
        setSelectedIndex(-1);

        saveFlagResult(currentCountry?.cca2 || "", false);
    };

    const saveHighscore = async (finalScore: number) => {
        if (finalScore <= 0) return;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsLoggedIn(false);
            return;
        }
        setIsLoggedIn(true);

        // Insert the new highscore with game_mode
        await supabase.from("highscores").insert({
            user_id: user.id,
            score: finalScore,
            game_mode: "expert",
        });

        // Get the rank (count of scores higher than ours + 1) for this game mode
        const { count } = await supabase
            .from("highscores")
            .select("*", { count: "exact", head: true })
            .eq("game_mode", "expert")
            .gt("score", finalScore);

        setRank((count ?? 0) + 1);
    };

    const handleEndGame = () => {
        // Clear any pending auto-advance timer
        if (autoAdvanceTimerRef.current) {
            clearTimeout(autoAdvanceTimerRef.current);
            autoAdvanceTimerRef.current = null;
        }
        setGameEnded(true);
        saveHighscore(score);
    };

    const handleRestart = () => {
        setScore(0);
        setTotal(0);
        setGameEnded(false);
        setRank(null);
        setCurrentCountry(null);
        flagHistory.current.reset();
        setTimeout(() => loadNewQuestion(), 0);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        handleSubmit(suggestion);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Tab to autocomplete (only fills in the text, does not submit)
        if (e.key === "Tab" && suggestions.length > 0) {
            e.preventDefault();
            const suggestionToUse = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
            setInputValue(suggestionToUse);
            setShowSuggestions(false);
            setSelectedIndex(-1);
            return;
        }

        // Navigation in suggestions
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                return;
            }
        }

        // Escape to skip
        if (e.key === "Escape") {
            e.preventDefault();
            handleSkip();
        }
    };

    const handleNext = () => {
        loadNewQuestion();
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

            <div className="relative z-12 flex flex-1 flex-col items-center justify-center overflow-hidden dark:bg-black px-4">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="rounded-2xl border border-white/10 bg-black p-8 md:p-12 backdrop-blur-xl shadow-2xl pb-24">
                        <AnimatePresence mode="wait">
                            {gameEnded ? (
                                <motion.div
                                    key="gameover"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-center space-y-8"
                                >
                                    <div className="text-6xl mb-4">🧠</div>
                                    <h2 className="text-4xl font-bold text-white">Spiel beendet!</h2>
                                    <p className="text-2xl text-neutral-300">
                                        Dein Punktestand: <span className="text-green-400 font-bold">{score}</span> von {total}
                                    </p>
                                    {rank !== null && (
                                        <div className="flex items-center justify-center gap-2">
                                            {rank <= 3 ? (
                                                <span className="text-4xl">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                                            ) : (
                                                <span className="text-2xl">🏅</span>
                                            )}
                                            <p className="text-xl text-amber-400">
                                                Platz <span className="font-bold">{rank}</span> in der Bestenliste!
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                        <button
                                            onClick={handleRestart}
                                            className="text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-lg px-8 py-4 shadow-lg shadow-purple-500/20 transition-all"
                                        >
                                            Nochmal spielen
                                        </button>
                                        <Link
                                            href="/game/modes"
                                            className="text-white bg-zinc-700 hover:bg-zinc-600 focus:ring-4 focus:ring-zinc-500 font-medium rounded-lg text-lg px-8 py-4 transition-colors"
                                        >
                                            Zurück zur Auswahl
                                        </Link>
                                    </div>
                                </motion.div>
                            ) : currentCountry ? (
                                <motion.div
                                    key="game"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-12"
                                >
                                    {/* Score */}
                                    <div className="text-center mb-8">
                                        <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl">
                                            <span className="text-lg font-semibold text-white">
                                                <span className="text-purple-400">🧠 Experte</span> | Punkte:{" "}
                                                <span className="text-green-400">{score}</span> von {total}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Flag */}
                                    <div className="flex items-center justify-center">
                                        <div className="relative w-full max-w-md aspect-[3/2] flex items-center justify-center">
                                            <img
                                                src={currentCountry.flags?.svg || currentCountry.flags?.png || ""}
                                                alt="Flagge"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>

                                    {/* Input Field */}
                                    <div className="relative max-w-md mx-auto">
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
                                                disabled={isAnswered}
                                                className={cn(
                                                    "w-full px-6 py-4 text-lg rounded-xl border-2 bg-black/50 text-white placeholder-neutral-500 focus:outline-none transition-colors",
                                                    isAnswered && isCorrect
                                                        ? "border-green-500 bg-green-500/10"
                                                        : isAnswered && !isCorrect
                                                            ? "border-red-500 bg-red-500/10"
                                                            : "border-white/20 focus:border-purple-500"
                                                )}
                                            />
                                            {!isAnswered && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                    {inputValue.trim() && (
                                                        <button
                                                            onClick={() => handleSubmit(inputValue)}
                                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                                                        >
                                                            Prüfen
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={handleSkip}
                                                        className="px-3 h-[42px] bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                                        title="Überspringen (ESC)"
                                                    >
                                                        <IconPlayerSkipForward className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleEndGame}
                                                        className="px-3 h-[42px] bg-red-700 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                                                        title="Spiel beenden"
                                                    >
                                                        <IconDoorExit className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>



                                        {/* Suggestions Dropdown */}
                                        <AnimatePresence>
                                            {showSuggestions && suggestions.length > 0 && !isAnswered && (
                                                <motion.div
                                                    ref={suggestionsRef}
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
                                                                "w-full px-4 py-3 text-left text-white transition-colors border-b border-white/5 last:border-b-0",
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

                                    {/* Result Message */}
                                    <AnimatePresence>
                                        {isAnswered && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-center"
                                            >
                                                {isCorrect ? (
                                                    <p className="text-2xl font-bold text-green-400">✓ Richtig!</p>
                                                ) : isSkipped ? (
                                                    <p className="text-xl text-amber-400">
                                                        ⏭ Übersprungen! Es war:{" "}
                                                        <span className="font-bold text-white">{correctAnswer}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-xl text-red-400">
                                                        ✗ Falsch! Richtig war:{" "}
                                                        <span className="font-bold text-white">{correctAnswer}</span>
                                                    </p>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Next Button */}
                                    <div className="flex justify-center mt-6 min-h-[52px]">
                                        {isAnswered && (
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                            >
                                                Weiter (Enter)
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center text-white">
                                    <p>Lädt...</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
