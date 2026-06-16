"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { GridBackground } from "@/components/ui/grid-background";
import { getGermanName } from "@/lib/countryNames";
import { getSimilarFlags } from "@/lib/similarFlags";
import { saveFlagResult, getUserStats, FlagStats } from "@/lib/stats";
import { FlagHistory } from "@/lib/flagHistory";
import { QuestionTimer } from "@/components/game/question-timer";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/auth-modal";
import { createClient } from "@/lib/supabase/client";

interface Country {
    name: { common: string; official: string };
    flags: { svg?: string; png?: string };
    cca2: string;
}

export default function TrainingPage() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [pool, setPool] = useState<Country[]>([]);
    const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
    const [options, setOptions] = useState<string[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [score, setScore] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [questionKey, setQuestionKey] = useState(0);
    const flagHistory = useRef(new FlagHistory(10));

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            setIsLoggedIn(true);

            try {
                const [stats, countriesRes]: [FlagStats[], Country[]] = await Promise.all([
                    getUserStats(),
                    fetch("https://restcountries.com/v3.1/all?fields=flags,name,cca2", {
                        cache: "force-cache",
                        headers: { Accept: "application/json" },
                    }).then((r) => r.json()),
                ]);

                setCountries(countriesRes);
                const byCode: Record<string, Country> = {};
                countriesRes.forEach((c) => { byCode[c.cca2] = c; });

                // The training pool = flags the user has gotten wrong, worst first (Issue #11)
                const worst = stats
                    .filter((s) => s.times_wrong > 0)
                    .sort((a, b) => {
                        const accA = a.times_correct / (a.times_correct + a.times_wrong);
                        const accB = b.times_correct / (b.times_correct + b.times_wrong);
                        if (accA !== accB) return accA - accB;
                        return b.times_wrong - a.times_wrong;
                    })
                    .map((s) => byCode[s.country_code])
                    .filter((c): c is Country => Boolean(c))
                    .slice(0, 40);

                setPool(worst);
                // Smaller history window so a tiny pool still rotates.
                flagHistory.current = new FlagHistory(Math.max(0, Math.min(10, worst.length - 1)));
            } catch (e) {
                console.error("Fehler beim Laden:", e);
            }
            setLoading(false);
        };

        init();
    }, []);

    useEffect(() => {
        if (pool.length > 0 && countries.length > 0 && !currentCountry) {
            loadNewQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pool.length, countries.length]);

    const loadNewQuestion = () => {
        if (pool.length === 0 || countries.length === 0) return;

        const available = pool.filter((c) => flagHistory.current.canShowFlag(c.cca2));
        if (available.length === 0) {
            flagHistory.current.reset();
            return loadNewQuestion();
        }

        const randomCountry = available[Math.floor(Math.random() * available.length)];
        flagHistory.current.addFlag(randomCountry.cca2);

        const wrongAnswers: string[] = [];
        const similarToCorrect = getSimilarFlags(randomCountry.name.common);
        const correctGermanName = getGermanName(randomCountry.name.common);
        let attempts = 0;
        while (wrongAnswers.length < 3 && attempts < 300) {
            attempts++;
            const country = countries[Math.floor(Math.random() * countries.length)];
            const germanName = getGermanName(country.name.common);
            if (
                germanName !== correctGermanName &&
                !wrongAnswers.includes(germanName) &&
                !similarToCorrect.includes(country.name.common)
            ) {
                wrongAnswers.push(germanName);
            }
        }

        const allOptions = [correctGermanName, ...wrongAnswers].sort(() => Math.random() - 0.5);

        setCurrentCountry(randomCountry);
        setOptions(allOptions);
        setSelectedAnswer(null);
        setCorrectAnswer(correctGermanName);
        setIsAnswered(false);
        setTimedOut(false);
        setQuestionKey((k) => k + 1);
    };

    const handleAnswer = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
        setIsAnswered(true);
        setTotal((t) => t + 1);
        const correct = answer === correctAnswer;
        if (correct) setScore((s) => s + 1);
        saveFlagResult(currentCountry?.cca2 || "", correct);
    };

    const handleTimeout = () => {
        if (isAnswered) return;
        setIsAnswered(true);
        setSelectedAnswer(null);
        setTimedOut(true);
        setTotal((t) => t + 1);
        saveFlagResult(currentCountry?.cca2 || "", false);
    };

    const handleNext = () => loadNewQuestion();

    const getButtonClassName = (option: string) => {
        const base = "text-white font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none transition-colors min-h-[56px] text-base";
        if (isAnswered && option === correctAnswer) {
            return cn(base, "bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300");
        }
        if (isAnswered && option === selectedAnswer && option !== correctAnswer) {
            return cn(base, "bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300");
        }
        return cn(base, "bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300");
    };

    const sidebarLinks = [
        { label: "Start", href: "/", icon: <IconHome className="h-6 w-6 shrink-0 text-white" /> },
        { label: "Spielen", href: "/game/modes", icon: <IconDeviceGamepad className="h-6 w-6 shrink-0 text-white" /> },
        { label: "Flaggen", href: "/flaggen", icon: <IconFlag className="h-6 w-6 shrink-0 text-white" /> },
        { label: "Über", href: "#about", icon: <IconInfoCircle className="h-6 w-6 shrink-0 text-white" /> },
    ];

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

            <div className="relative z-10 flex flex-1 flex-col items-center justify-start overflow-y-auto dark:bg-black px-4 py-6 md:justify-center md:py-0">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="rounded-2xl border border-white/10 bg-black p-8 md:p-12 backdrop-blur-xl shadow-2xl pb-24">
                        {loading ? (
                            <div className="text-center text-white"><p>Lädt...</p></div>
                        ) : isLoggedIn === false ? (
                            <div className="text-center space-y-6">
                                <div className="text-6xl mb-2">🔒</div>
                                <h2 className="text-3xl font-bold text-white">Anmeldung erforderlich</h2>
                                <p className="text-lg text-neutral-300">
                                    Dieser Modus übt deine schwächsten Flaggen. Dafür müssen wir
                                    deine Statistik kennen – bitte melde dich an.
                                </p>
                                <p className="text-neutral-400">Du kannst dich über die Seitenleiste anmelden.</p>
                            </div>
                        ) : pool.length === 0 ? (
                            <div className="text-center space-y-6">
                                <div className="text-6xl mb-2">🎉</div>
                                <h2 className="text-3xl font-bold text-white">Keine Fehler vorhanden!</h2>
                                <p className="text-lg text-neutral-300">
                                    Du hast bisher keine Flaggen falsch beantwortet. Spiele ein paar
                                    Runden in den anderen Modi – dann sammeln sich hier deine
                                    schwierigsten Flaggen zum gezielten Üben.
                                </p>
                                <Link
                                    href="/game/modes"
                                    className="inline-block text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-lg px-8 py-4 transition-colors"
                                >
                                    Zu den Spielmodi
                                </Link>
                            </div>
                        ) : currentCountry ? (
                            <AnimatePresence mode="wait">
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
                                                <span className="text-orange-400">🎯 Fehler trainieren</span> | Punkte:{" "}
                                                <span className="text-green-400">{score}</span> von {total}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timer (Issue #14) */}
                                    <QuestionTimer
                                        resetKey={questionKey}
                                        isActive={!isAnswered}
                                        onTimeout={handleTimeout}
                                    />

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

                                    {/* Timeout-Hinweis */}
                                    {timedOut && (
                                        <p className="text-center text-lg font-semibold text-red-400">
                                            ⏰ Zeit abgelaufen!
                                        </p>
                                    )}

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
                                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none"
                                            >
                                                Weiter
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="text-center text-white"><p>Lädt...</p></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
