"use client";

import { useEffect, useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad, IconTrophy, IconTrendingUp, IconTrendingDown, IconChartBar, IconCheck, IconX } from "@tabler/icons-react";
import { AuthModal } from "@/components/auth/auth-modal";
import { AuthForm } from "@/components/auth/auth-form";
import { motion } from "motion/react";
import { getUserStats, FlagStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/client";
import { getGermanName } from "@/lib/countryNames";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Country {
    name: { common: string; official: string };
    flags: { svg?: string; png?: string };
    cca2: string;
}

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

export default function ProfilePage() {
    const [stats, setStats] = useState<FlagStats[]>([]);
    const [countries, setCountries] = useState<Record<string, Country>>({});
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        const fetchData = async (currUser: any) => {
            if (currUser) {
                setLoading(true);
                const [statsData, countriesRes, profileRes] = await Promise.all([
                    getUserStats(),
                    fetch("https://restcountries.com/v3.1/all?fields=flags,name,cca2").then(r => r.json()),
                    supabase.from("profiles").select("username").eq("id", currUser.id).single()
                ]);

                const countriesMap: Record<string, Country> = {};
                (countriesRes as Country[]).forEach(c => {
                    countriesMap[c.cca2] = c;
                });
                setCountries(countriesMap);
                setStats(statsData);
                const fetchedUsername = profileRes.data?.username ?? null;
                setUsername(fetchedUsername);
                setNewUsername(fetchedUsername || "");
            } else {
                setStats([]);
                setUsername(null);
            }
            setLoading(false);
        };

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) await fetchData(user);
            else setLoading(false);
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const newUser = session?.user ?? null;
            setUser(newUser);
            if (newUser) fetchData(newUser);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpdateUsername = async () => {
        if (!newUsername.trim() || newUsername === username) {
            setIsEditingUsername(false);
            return;
        }

        if (newUsername.length < 3) {
            setUpdateError("Minimal 3 Zeichen");
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
            setUpdateError("Nur Buchstaben, Zahlen und _");
            return;
        }

        setIsUpdating(true);
        setUpdateError(null);

        const supabase = createClient();
        const { error } = await supabase
            .from("profiles")
            .upsert({ id: user.id, username: newUsername.trim() });

        if (error) {
            if (error.code === "23505") {
                setUpdateError("Name schon vergeben");
            } else {
                setUpdateError("Fehler beim Speichern");
            }
        } else {
            setUsername(newUsername.trim());
            setIsEditingUsername(false);
        }
        setIsUpdating(false);
    };

    const totalAnswered = stats.reduce((acc, curr) => acc + curr.times_correct + curr.times_wrong, 0);
    const totalCorrect = stats.reduce((acc, curr) => acc + curr.times_correct, 0);
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    const bestFlags = [...stats]
        .filter(s => s.times_correct + s.times_wrong >= 3) // Min 3 tries
        .sort((a, b) => (b.times_correct / (b.times_correct + b.times_wrong)) - (a.times_correct / (a.times_correct + a.times_wrong)))
        .slice(0, 5);

    const worstFlags = [...stats]
        .filter(s => s.times_correct + s.times_wrong >= 3 && s.times_wrong > 0) // Min 3 tries AND at least 1 error
        .sort((a, b) => (a.times_correct / (a.times_correct + a.times_wrong)) - (b.times_correct / (b.times_correct + b.times_wrong)))
        .slice(0, 5);

    return (
        <div className="relative flex flex-col md:flex-row h-dvh w-full overflow-hidden bg-zinc-950">
            {/* Simple Noise Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

            <Sidebar>
                <SidebarBody className="justify-between gap-10 bg-black/40 backdrop-blur-xl border-r border-white/5">
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
                                href: "/",
                                icon: <IconArrowLeft className="h-6 w-6 shrink-0 text-white" />,
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            <div className="relative z-12 flex flex-1 flex-col overflow-y-auto w-full p-6 md:p-12">
                <div className="max-w-6xl mx-auto w-full space-y-12 pb-24">

                    {/* Header Section */}
                    {user && (
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Dein Profil</h1>
                                <p className="text-zinc-400 text-lg">Verfolge deinen Fortschritt und verbessere dein Wissen.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {isEditingUsername ? (
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            {updateError && (
                                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-400 whitespace-nowrap">
                                                    {updateError}
                                                </span>
                                            )}
                                            <input
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                className="bg-black/40 border border-white/20 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-40"
                                                autoFocus
                                                onKeyDown={(e) => e.key === "Enter" && handleUpdateUsername()}
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdateUsername}
                                            disabled={isUpdating}
                                            className="p-2 hover:bg-white/10 rounded-full text-green-400 transition-colors"
                                        >
                                            <IconCheck size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setIsEditingUsername(false); setUpdateError(null); }}
                                            className="p-2 hover:bg-white/10 rounded-full text-red-400 transition-colors"
                                        >
                                            <IconX size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => { setIsEditingUsername(true); setUpdateError(null); }}
                                        className="group cursor-pointer relative min-w-[140px] px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-zinc-300 text-sm flex justify-center items-center transition-all"
                                    >
                                        <span>{username}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </div>
                                )}
                                <Link
                                    href="/highscore"
                                    className="flex items-center justify-center gap-2 min-w-[140px] px-5 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 hover:border-amber-500/30 rounded-full text-zinc-300 hover:text-amber-400 text-sm font-medium transition-all"
                                >
                                    <IconTrophy className="w-4 h-4" />
                                    <span>Bestenliste</span>
                                </Link>
                            </div>
                        </div>
                    )}
                    {!user && !loading && (
                        <div className="text-center pb-4">
                            <h1 className="text-4xl md:text-5xl font-bold text-white">GenFlag</h1>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-white">
                            <div className="text-xl animate-pulse">Lade Statistiken...</div>
                        </div>
                    ) : !user ? (
                        <div className="flex flex-col items-center py-16 px-8 bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-sm w-full max-w-lg mx-auto min-h-[520px]">
                            <AuthForm />
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MetricCard
                                    title="Gespielte Flaggen"
                                    value={totalAnswered}
                                    icon={<IconFlag className="text-blue-500 w-8 h-8" />}
                                    trend="Gesamt"
                                    color="text-blue-500"
                                />
                                <MetricCard
                                    title="Richtige Antworten"
                                    value={totalCorrect}
                                    icon={<IconCheck className="text-green-500 w-8 h-8" />}
                                    trend={totalAnswered > 0 ? ((totalCorrect / totalAnswered) * 100).toFixed(0) + "% Rate" : "0% Rate"}
                                    color="text-green-500"
                                />
                                <MetricCard
                                    title="Genauigkeit"
                                    value={`${accuracy}%`}
                                    icon={<IconChartBar className="text-purple-500 w-8 h-8" />}
                                    trend="Durchschnitt"
                                    color="text-purple-500"
                                />
                            </div>

                            {/* Detailed Stats Sections */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Best Flags */}
                                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-32 bg-green-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                                        <div className="p-2 bg-green-500/10 rounded-lg">
                                            <IconTrendingUp className="text-green-400 w-6 h-6" />
                                        </div>
                                        Deine Stärken
                                    </h2>

                                    {bestFlags.length > 0 ? (
                                        <div className="space-y-4 relative z-10">
                                            {bestFlags.map((stat, idx) => {
                                                const country = countries[stat.country_code];
                                                if (!country) return null;
                                                const rate = Math.round((stat.times_correct / (stat.times_correct + stat.times_wrong)) * 100);

                                                return (
                                                    <div key={stat.country_code} className="group flex items-center gap-4 p-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-green-500/30 rounded-2xl transition-all duration-300">
                                                        <div className="flex-shrink-0 text-xl font-bold text-green-500/50 w-6 text-center">{idx + 1}</div>
                                                        <img src={country.flags.svg} alt="Flag" className="h-10 w-16 object-cover rounded-md shadow-sm" />
                                                        <div className="flex-grow min-w-0">
                                                            <div className="font-semibold text-white truncate">{getGermanName(country.name.common)}</div>
                                                            <div className="text-xs text-zinc-500">{stat.times_correct} Richtig / {stat.times_correct + stat.times_wrong} Gesamt</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-green-400">{rate}%</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-zinc-500 italic">
                                            Spiele mehr Runden, um deine Stärken zu sehen.
                                        </div>
                                    )}
                                </div>

                                {/* Worst Flags */}
                                <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <IconTrendingDown className="text-red-400 w-6 h-6" />
                                        </div>
                                        Lernbedarf
                                    </h2>

                                    {worstFlags.length > 0 ? (
                                        <div className="space-y-4 relative z-10">
                                            {worstFlags.map((stat, idx) => {
                                                const country = countries[stat.country_code];
                                                if (!country) return null;
                                                const rate = Math.round((stat.times_correct / (stat.times_correct + stat.times_wrong)) * 100);

                                                return (
                                                    <div key={stat.country_code} className="group flex items-center gap-4 p-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-red-500/30 rounded-2xl transition-all duration-300">
                                                        <div className="flex-shrink-0 text-xl font-bold text-red-500/50 w-6 text-center">{idx + 1}</div>
                                                        <img src={country.flags.svg} alt="Flag" className="h-10 w-16 object-cover rounded-md shadow-sm" />
                                                        <div className="flex-grow min-w-0">
                                                            <div className="font-semibold text-white truncate">{getGermanName(country.name.common)}</div>
                                                            <div className="text-xs text-zinc-500">{stat.times_wrong} Falsch / {stat.times_correct + stat.times_wrong} Gesamt</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-red-400">{rate}%</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-zinc-500 italic">
                                            Keine Fehler bisher! Weiter so.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, trend, color }: { title: string, value: string | number, icon: React.ReactNode, trend: string, color: string }) {
    return (
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:bg-zinc-900/60 transition-colors duration-300">
            <div className={cn("absolute top-0 right-0 p-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none", color.replace('text-', 'bg-'))} />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    {icon}
                </div>
                <div className={cn("px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/5", color)}>
                    {trend}
                </div>
            </div>
            <div className="relative z-10">
                <div className="text-4xl font-bold text-white mb-1 tracking-tight">{value}</div>
                <div className="text-zinc-500 font-medium">{title}</div>
            </div>
        </div>
    );
}
