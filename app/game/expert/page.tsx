"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { GridBackground } from "@/components/ui/grid-background";
import { getGermanName } from "@/lib/countryNames";
import { saveFlagResult } from "@/lib/stats";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";

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
    const [score, setScore] = useState(0);
    const [total, setTotal] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

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

    const loadNewQuestion = () => {
        if (countries.length === 0) return;

        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        const correctGermanName = getGermanName(randomCountry.name.common);

        setCurrentCountry(randomCountry);
        setCorrectAnswer(correctGermanName);
        setInputValue("");
        setIsAnswered(false);
        setIsCorrect(false);
        setShowSuggestions(false);

        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSubmit = (answer: string) => {
        if (isAnswered) return;

        const normalizedAnswer = answer.trim().toLowerCase();
        const normalizedCorrect = correctAnswer.toLowerCase();
        const correct = normalizedAnswer === normalizedCorrect;

        setIsAnswered(true);
        setIsCorrect(correct);
        setTotal((prev) => prev + 1);
        setShowSuggestions(false);

        if (correct) {
            setScore((prev) => prev + 1);
        }

        saveFlagResult(currentCountry?.cca2 || "", correct);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
        handleSubmit(suggestion);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && inputValue.trim()) {
            handleSubmit(inputValue);
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
                        {currentCountry ? (
                            <div className="space-y-12">
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
                                        {!isAnswered && inputValue.trim() && (
                                            <button
                                                onClick={() => handleSubmit(inputValue)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Prüfen
                                            </button>
                                        )}
                                    </div>

                                    {/* Suggestions Dropdown */}
                                    <AnimatePresence>
                                        {showSuggestions && suggestions.length > 0 && !isAnswered && (
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
                                                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
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
                                            Weiter
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-white">
                                <p>Lädt...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
