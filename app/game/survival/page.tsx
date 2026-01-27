"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { GridBackground } from "@/components/ui/grid-background";
import { getGermanName } from "@/lib/countryNames";
import { getSimilarFlags } from "@/lib/similarFlags";
import { saveFlagResult } from "@/lib/stats";
import { FlagHistory } from "@/lib/flagHistory";
import { saveGameProgress, loadGameProgress, clearGameProgress } from "@/lib/gameProgress";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";

interface Country {
    name: { common: string; official: string };
    flags: { svg?: string; png?: string };
    cca2: string;
}

export default function SurvivalPage() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);
    const [rank, setRank] = useState<number | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showResumeDialog, setShowResumeDialog] = useState(false);
    const [savedProgress, setSavedProgress] = useState<{ score: number; lives: number } | null>(null);
    const flagHistory = useRef(new FlagHistory(40));
    const hasCheckedProgress = useRef(false);

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

    // Check for saved progress on mount
    useEffect(() => {
        const checkProgress = async () => {
            if (hasCheckedProgress.current) return;
            hasCheckedProgress.current = true;

            const progress = await loadGameProgress("survival");
            if (progress && progress.score > 0 && progress.lives && progress.lives > 0) {
                setSavedProgress({ score: progress.score, lives: progress.lives });
                setShowResumeDialog(true);
                if (progress.flagHistory) {
                    progress.flagHistory.forEach(code => flagHistory.current.addFlag(code));
                }
            }
        };
        checkProgress();
    }, []);

    useEffect(() => {
        if (countries.length > 0 && !currentCountry && !gameOver && !showResumeDialog) {
            loadNewQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countries.length, showResumeDialog]);

    const loadNewQuestion = () => {
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

        const wrongAnswers: string[] = [];
        const similarToCorrect = getSimilarFlags(randomCountry.name.common);
        let attempts = 0;
        while (wrongAnswers.length < 3 && attempts < 200) {
            attempts++;
            const randomIndex = Math.floor(Math.random() * countries.length);
            const country = countries[randomIndex];
            const germanName = getGermanName(country.name.common);
            const randomCountryGermanName = getGermanName(randomCountry.name.common);

            if (
                germanName !== randomCountryGermanName &&
                !wrongAnswers.includes(germanName) &&
                !similarToCorrect.includes(country.name.common)
            ) {
                wrongAnswers.push(germanName);
            }
        }

        const correctGermanName = getGermanName(randomCountry.name.common);
        const allOptions = [correctGermanName, ...wrongAnswers];
        const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

        setCurrentCountry(randomCountry);
        setOptions(shuffledOptions);
        setSelectedAnswer(null);
        setCorrectAnswer(correctGermanName);
        setIsAnswered(false);
    };

    const handleAnswer = (answer: string) => {
        if (isAnswered || gameOver) return;

        setSelectedAnswer(answer);
        setIsAnswered(true);

        if (answer === correctAnswer) {
            const newScore = score + 1;
            setScore(newScore);
            saveFlagResult(currentCountry?.cca2 || "", true);
            // Save progress after each correct answer
            saveGameProgress("survival", {
                score: newScore,
                lives,
                flagHistory: flagHistory.current.getHistory(),
            });
        } else {
            saveFlagResult(currentCountry?.cca2 || "", false);
            const newLives = lives - 1;
            setLives(newLives);
            if (newLives <= 0) {
                setGameOver(true);
                clearGameProgress("survival");
                saveHighscore(score + (answer === correctAnswer ? 1 : 0));
            } else {
                // Save progress with reduced lives
                saveGameProgress("survival", {
                    score,
                    lives: newLives,
                    flagHistory: flagHistory.current.getHistory(),
                });
            }
        }
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
            game_mode: "survival",
        });

        // Get the rank (count of scores higher than ours + 1) for this game mode
        const { count } = await supabase
            .from("highscores")
            .select("*", { count: "exact", head: true })
            .eq("game_mode", "survival")
            .gt("score", finalScore);

        setRank((count ?? 0) + 1);
    };

    const handleNext = () => {
        if (!gameOver) {
            loadNewQuestion();
        }
    };

    const handleRestart = () => {
        setLives(3);
        setScore(0);
        setGameOver(false);
        setRank(null);
        setCurrentCountry(null);
        flagHistory.current.reset();
        clearGameProgress("survival");
        setTimeout(() => loadNewQuestion(), 0);
    };

    const handleResume = () => {
        if (savedProgress) {
            setScore(savedProgress.score);
            setLives(savedProgress.lives);
        }
        setShowResumeDialog(false);
        loadNewQuestion();
    };

    const handleNewGame = () => {
        clearGameProgress("survival");
        flagHistory.current.reset();
        setShowResumeDialog(false);
        loadNewQuestion();
    };

    const getButtonClassName = (option: string) => {
        const base = "text-white font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none transition-colors min-h-[56px] text-base";

        if (isAnswered && option === correctAnswer) {
            return cn(
                base,
                "bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            );
        }

        if (isAnswered && option === selectedAnswer && option !== correctAnswer) {
            return cn(
                base,
                "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
            );
        }

        return cn(
            base,
            "bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        );
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
                            {showResumeDialog ? (
                                <motion.div
                                    key="resume"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-center space-y-8"
                                >
                                    <div className="text-6xl mb-4">💾</div>
                                    <h2 className="text-3xl font-bold text-white">Spielstand gefunden!</h2>
                                    <p className="text-xl text-neutral-300">
                                        Du hast einen Spielstand mit{" "}
                                        <span className="text-green-400 font-bold">{savedProgress?.score}</span> Punkten und{" "}
                                        <span className="text-red-400 font-bold">{savedProgress?.lives}</span> Leben.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                        <button
                                            onClick={handleResume}
                                            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-lg px-8 py-4 shadow-lg shadow-green-500/20 transition-all"
                                        >
                                            Fortsetzen
                                        </button>
                                        <button
                                            onClick={handleNewGame}
                                            className="text-white bg-zinc-700 hover:bg-zinc-600 focus:ring-4 focus:ring-zinc-500 font-medium rounded-lg text-lg px-8 py-4 transition-colors"
                                        >
                                            Neues Spiel
                                        </button>
                                    </div>
                                </motion.div>
                            ) : gameOver ? (
                                <motion.div
                                    key="gameover"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-center space-y-8"
                                >
                                    <div className="text-6xl mb-4">💀</div>
                                    <h2 className="text-4xl font-bold text-white">Game Over!</h2>
                                    <p className="text-2xl text-neutral-300">
                                        Dein Punktestand: <span className="text-green-400 font-bold">{score}</span>
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
                                            className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-lg px-8 py-4 shadow-lg shadow-green-500/20 transition-all"
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
                                    {/* Lives and Score */}
                                    <div className="flex items-center justify-center gap-8 mb-8">
                                        <div className="flex items-center gap-2">
                                            {[...Array(3)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={false}
                                                    animate={i < lives ? { scale: 1 } : { scale: 0.8 }}
                                                >
                                                    {i < lives ? (
                                                        <IconHeartFilled className="h-8 w-8 text-red-500" />
                                                    ) : (
                                                        <IconHeart className="h-8 w-8 text-neutral-600" />
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl">
                                            <span className="text-lg font-semibold text-white">
                                                Punkte: <span className="text-green-400">{score}</span>
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

                                    {/* Answer Buttons */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {options.map((option, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={getButtonClassName(option)}
                                                onClick={() => handleAnswer(option)}
                                                disabled={isAnswered}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Next Button */}
                                    <div className="flex justify-center mt-6 min-h-[52px]">
                                        {isAnswered && !gameOver && (
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                                            >
                                                Weiter
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
