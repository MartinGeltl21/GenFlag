"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import { AuthModal } from "@/components/auth/auth-modal";
import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconInfinity, IconHeart, IconWorld, IconBrain, IconSwords } from "@tabler/icons-react";

interface GameMode {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    gradient: string;
}

const gameModes: GameMode[] = [
    {
        title: "Unendlich",
        description: "Spiele ohne Ende - keine Grenzen, kein Zeitlimit",
        href: "/game",
        icon: <IconInfinity className="h-10 w-10" />,
        gradient: "from-blue-500 to-cyan-400",
    },
    {
        title: "Überleben",
        description: "3 Leben - wie weit kommst du?",
        href: "/game/survival",
        icon: <IconHeart className="h-10 w-10" />,
        gradient: "from-red-500 to-pink-500",
    },
    {
        title: "Regionen",
        description: "Trainiere gezielt einzelne Kontinente",
        href: "/game/regions",
        icon: <IconWorld className="h-10 w-10" />,
        gradient: "from-green-500 to-emerald-400",
    },
    {
        title: "Experte",
        description: "Tippe den Ländernamen selbst ein",
        href: "/game/expert",
        icon: <IconBrain className="h-10 w-10" />,
        gradient: "from-purple-500 to-violet-500",
    },
    {
        title: "1v1 Duell",
        description: "Fordere einen Freund heraus!",
        href: "/game/duel",
        icon: <IconSwords className="h-10 w-10" />,
        gradient: "from-orange-500 to-amber-400",
    },
];

export default function ModesPage() {
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
        <div className="relative flex flex-col md:flex-row h-dvh w-full overflow-hidden dark:bg-black bg-black">
            {/* Dots Background */}
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 z-0 bg-black",
                    "[background-size:20px_20px]",
                    "[background-image:radial-gradient(#ffffff_1px,transparent_1px)]",
                )}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            {/* Sidebar */}
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
                                href: "/",
                                icon: <IconArrowLeft className="h-6 w-6 shrink-0 text-white" />,
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* Main Content */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12">
                <div className="w-full max-w-4xl mx-auto bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-white text-center mb-4"
                    >
                        Wähle deinen Spielmodus
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-neutral-400 text-center mb-12 text-lg"
                    >
                        Vom entspannten Training bis zur ultimativen Herausforderung
                    </motion.p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {gameModes.map((mode, index) => (
                            <motion.div
                                key={mode.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (index + 1) }}
                            >
                                <Link href={mode.href}>
                                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-black/70 hover:scale-[1.02]">
                                        {/* Gradient Background */}
                                        <div
                                            className={cn(
                                                "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br",
                                                mode.gradient
                                            )}
                                        />

                                        <div className="relative z-10 flex items-start gap-4">
                                            <div
                                                className={cn(
                                                    "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                                                    mode.gradient
                                                )}
                                            >
                                                {mode.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-semibold text-white mb-2">
                                                    {mode.title}
                                                </h2>
                                                <p className="text-neutral-400 text-sm">
                                                    {mode.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
