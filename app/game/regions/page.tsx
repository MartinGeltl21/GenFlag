"use client";

import { useState, useEffect } from "react";
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
    region: string;
}

const regions = [
    { id: "Europe", name: "Europa", emoji: "🇪🇺", color: "from-blue-500 to-blue-600" },
    { id: "Asia", name: "Asien", emoji: "🌏", color: "from-red-500 to-orange-500" },
    { id: "Africa", name: "Afrika", emoji: "🌍", color: "from-yellow-500 to-amber-600" },
    { id: "Americas", name: "Amerika", emoji: "🌎", color: "from-green-500 to-emerald-600" },
    { id: "Oceania", name: "Ozeanien", emoji: "🏝️", color: "from-cyan-500 to-teal-600" },
];

export default function RegionsPage() {
    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await fetch("https://restcountries.com/v3.1/all?fields=flags,name,cca2,region", {
                    cache: "force-cache",
                    headers: { Accept: "application/json" },
                });
                const data: Country[] = await res.json();
                setAllCountries(data);
                setLoading(false);
            } catch (e) {
                console.error("Fehler beim Laden der Länder:", e);
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const selectRegion = (regionId: string) => {
        const regionCountries = allCountries.filter((c) => c.region === regionId);
        setCountries(regionCountries);
        setSelectedRegion(regionId);
        setScore(0);
        setTotal(0);
        setCurrentCountry(null);
        setTimeout(() => loadNewQuestion(regionCountries), 0);
    };

    const loadNewQuestion = (countryList?: Country[]) => {
        const list = countryList || countries;
        if (list.length === 0) return;

        const randomCountry = list[Math.floor(Math.random() * list.length)];

        const wrongAnswers: string[] = [];
        let attempts = 0;
        while (wrongAnswers.length < 3 && attempts < 200) {
            attempts++;
            const randomIndex = Math.floor(Math.random() * list.length);
            const country = list[randomIndex];
            const germanName = getGermanName(country.name.common);
            const randomCountryGermanName = getGermanName(randomCountry.name.common);
            if (germanName !== randomCountryGermanName && !wrongAnswers.includes(germanName)) {
                wrongAnswers.push(germanName);
            }
        }

        // Fallback: Falls wir nicht genug falsche Antworten aus der Region finden (sehr unwahrscheinlich),
        // bedienen wir uns an allen Ländern, um Crashs zu vermeiden.
        if (wrongAnswers.length < 3) {
            let globalAttempts = 0;
            while (wrongAnswers.length < 3 && globalAttempts < 200) {
                globalAttempts++;
                const randomIndex = Math.floor(Math.random() * allCountries.length);
                const country = allCountries[randomIndex];
                const germanName = getGermanName(country.name.common);
                const randomCountryGermanName = getGermanName(randomCountry.name.common);
                if (germanName !== randomCountryGermanName && !wrongAnswers.includes(germanName)) {
                    wrongAnswers.push(germanName);
                }
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
        if (isAnswered) return;

        setSelectedAnswer(answer);
        setIsAnswered(true);
        setTotal((prev) => prev + 1);

        if (answer === correctAnswer) {
            setScore((prev) => prev + 1);
            saveFlagResult(currentCountry?.cca2 || "", true);
        } else {
            saveFlagResult(currentCountry?.cca2 || "", false);
        }
    };

    const handleNext = () => {
        loadNewQuestion();
    };

    const handleBackToSelection = () => {
        setSelectedRegion(null);
        setCurrentCountry(null);
        setScore(0);
        setTotal(0);
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

    const currentRegion = regions.find((r) => r.id === selectedRegion);

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
                    <AnimatePresence mode="wait">
                        {!selectedRegion ? (
                            <motion.div
                                key="selection"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="rounded-2xl border border-white/10 bg-black p-8 md:p-12 backdrop-blur-xl shadow-2xl"
                            >
                                <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
                                    Wähle eine Region
                                </h1>

                                {loading ? (
                                    <div className="text-center text-white">
                                        <p>Lädt...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {regions.map((region) => {
                                            const count = allCountries.filter((c) => c.region === region.id).length;
                                            return (
                                                <button
                                                    key={region.id}
                                                    onClick={() => selectRegion(region.id)}
                                                    className={cn(
                                                        "group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-105",
                                                        "bg-gradient-to-br",
                                                        region.color
                                                    )}
                                                >
                                                    <div className="text-4xl mb-3">{region.emoji}</div>
                                                    <h3 className="text-xl font-bold text-white">{region.name}</h3>
                                                    <p className="text-white/80 text-sm">{count} Länder</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        ) : currentCountry ? (
                            <motion.div
                                key="game"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="rounded-2xl border border-white/10 bg-black p-8 md:p-12 backdrop-blur-xl shadow-2xl pb-24"
                            >
                                <div className="space-y-12">
                                    {/* Region Badge and Score */}
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                                        <button
                                            onClick={handleBackToSelection}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-white font-medium bg-gradient-to-r",
                                                currentRegion?.color
                                            )}
                                        >
                                            <span>{currentRegion?.emoji}</span>
                                            <span>{currentRegion?.name}</span>
                                        </button>
                                        <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl">
                                            <span className="text-lg font-semibold text-white">
                                                Punkte: <span className="text-green-400">{score}</span> von {total}
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
    );
}
