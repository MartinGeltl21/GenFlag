"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GridBackground } from "@/components/ui/grid-background";
import { getGermanName } from "@/lib/countryNames";
import { saveFlagResult } from "@/lib/stats";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";

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
        if (countries.length > 0 && !currentCountry && !gameOver) {
            loadNewQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countries.length]);

    const loadNewQuestion = () => {
        if (countries.length === 0) return;

        const randomCountry = countries[Math.floor(Math.random() * countries.length)];

        const wrongAnswers: string[] = [];
        while (wrongAnswers.length < 3) {
            const randomIndex = Math.floor(Math.random() * countries.length);
            const country = countries[randomIndex];
            const germanName = getGermanName(country.name.common);
            const randomCountryGermanName = getGermanName(randomCountry.name.common);
            if (germanName !== randomCountryGermanName && !wrongAnswers.includes(germanName)) {
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
            setScore((prev) => prev + 1);
            saveFlagResult(currentCountry?.cca2 || "", true);
        } else {
            saveFlagResult(currentCountry?.cca2 || "", false);
            const newLives = lives - 1;
            setLives(newLives);
            if (newLives <= 0) {
                setGameOver(true);
            }
        }
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
        setCurrentCountry(null);
        setTimeout(() => loadNewQuestion(), 0);
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
                            {gameOver ? (
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
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={handleRestart}
                                            className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-lg px-8 py-4"
                                        >
                                            Nochmal spielen
                                        </button>
                                        <Link
                                            href="/game/modes"
                                            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-lg px-8 py-4"
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
