"use client";

import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { motion } from "motion/react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import { AuthModal } from "@/components/auth/auth-modal";

export default function Home() {
	const [images, setImages] = useState<string[]>([]);
	const [germanyFlag, setGermanyFlag] = useState<string>("");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("https://restcountries.com/v3.1/all?fields=flags,name,cca2", {
					cache: "force-cache",
					headers: { "Accept": "application/json" },
				});
				const data: Array<{ flags: { svg?: string; png?: string }; cca2?: string }> = await res.json();
				// Deutschland-Flagge finden
				const germany = data.find((c) => c.cca2 === "DE");
				if (germany && !cancelled) {
					setGermanyFlag(germany.flags?.svg || germany.flags?.png || "");
				}
				// Nur 50 Länder verwenden, dann zufällig mischen
				const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 50);
				const urls = shuffled
					.map((c) => c.flags?.svg || c.flags?.png)
					.filter((u): u is string => Boolean(u));
				if (!cancelled) setImages(urls);
			} catch (e) {
				if (!cancelled) setImages([]);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const sidebarLinks = [
		{
			label: "Start",
			href: "/",
			icon: <IconHome className="h-6 w-6 shrink-0 text-white" />,
		},
		{
			label: "Spielen",
			href: "/game",
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
		<div className="relative flex flex-col md:flex-row h-dvh w-full overflow-hidden bg-black">
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
					</div>
				</SidebarBody>
			</Sidebar>

			{/* Main Content */}
			<div className="relative z-12 flex flex-1 flex-col items-center justify-center overflow-hidden bg-black">
				{/* Dots Background */}
				<div
					className="pointer-events-none absolute inset-0 z-0"
					style={{
						backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23404040' id='pattern-circle' cx='10' cy='10' r='2.5'%3E%3C/circle%3E%3C/svg%3E")`,
					}}
				/>

				{/* 3D Marquee Background */}
				<ThreeDMarquee className="pointer-events-none absolute inset-0 z-[1] h-full w-full" images={images} />

				{/* Hero Section */}
				<section className="relative z-20 w-full px-4 py-24 md:py-32">
					<div className="mx-auto max-w-6xl">
						<div className="flex flex-col items-center gap-8 text-center">
							{/* Badge */}
							<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
								{germanyFlag ? (
									<img src={germanyFlag} alt="Deutschland" className="h-4 w-6 object-cover rounded-sm" />
								) : (
									<Globe className="h-4 w-4" />
								)}
								<span>Based in Germany</span>
							</div>

							{/* Heading */}
							<h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
								{"Das ultimative".split(" ").map((word, index) => (
									<motion.span
										key={index}
										initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
										animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
										transition={{
											duration: 0.3,
											delay: index * 0.1,
											ease: "easeInOut",
										}}
										className="mr-2 inline-block"
									>
										{word}
									</motion.span>
								))}
								{" "}
								<motion.span
									initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
									animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
									transition={{
										duration: 0.3,
										delay: "Das ultimative".split(" ").length * 0.1,
										ease: "easeInOut",
									}}
									className="relative inline-block px-2 pt-0 pb-3 mr-2"
									style={{
										background: "linear-gradient(90deg, rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%)",
										borderRadius: "0.5rem",
										lineHeight: "1",
										transform: "translateY(2px)",
									}}
								>
									Flaggen-Quiz
								</motion.span>
							</h1>

							{/* Description */}
							<motion.p
								initial={{
									opacity: 0,
								}}
								animate={{
									opacity: 1,
								}}
								transition={{
									duration: 0.3,
									delay: 0.8,
								}}
								className="max-w-2xl text-lg text-neutral-300 sm:text-xl md:text-2xl"
							>
								Trainiere dein Wissen zu Länderflaggen aus aller Welt. Errate Flaggen alleine oder messe dich mit deinen Freunden.
							</motion.p>

							{/* CTA Buttons */}
							<motion.div
								initial={{
									opacity: 0,
								}}
								animate={{
									opacity: 1,
								}}
								transition={{
									duration: 0.3,
									delay: 1,
								}}
								className="flex flex-wrap items-center justify-center gap-4"
							>
								<Button asChild size="lg" className="group">
									<Link href="/game/modes">
										Jetzt spielen
										<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
									</Link>
								</Button>
								<Button asChild variant="outline" size="lg">
									<Link href="/flaggen">Flaggen durchstöbern</Link>
								</Button>
							</motion.div>

							{/* Stats */}
							<motion.div
								initial={{
									opacity: 0,
									y: 10,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								transition={{
									duration: 0.3,
									delay: 1.2,
								}}
								className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center"
							>
								<div>
									<div className="text-3xl font-bold text-white">195+</div>
									<div className="text-sm text-neutral-400">Länder</div>
								</div>
								<div>
									<div className="text-3xl font-bold text-white">∞</div>
									<div className="text-sm text-neutral-400">Fragen</div>
								</div>
								<div>
									<div className="text-3xl font-bold text-white">100%</div>
									<div className="text-sm text-neutral-400">Kostenlos</div>
								</div>
							</motion.div>
						</div>
					</div>
				</section>
			</div>
		</div >
	);
}
