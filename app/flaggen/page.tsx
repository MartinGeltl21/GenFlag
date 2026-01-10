"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGermanName } from "@/lib/countryNames";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import { motion } from "motion/react";
import { AuthModal } from "@/components/auth/auth-modal";
import Link from "next/link";

interface Country {
	name: { common: string; official: string };
	flags: { svg?: string; png?: string };
	cca2: string;
	region: string;
	subregion?: string;
}

const continentNames: Record<string, string> = {
	Africa: "Afrika",
	Americas: "Amerika",
	Asia: "Asien",
	Europe: "Europa",
	Oceania: "Ozeanien",
	Antarctic: "Antarktis",
};

export default function FlaggenPage() {
	const [countries, setCountries] = useState<Country[]>([]);
	const [groupedByContinent, setGroupedByContinent] = useState<Record<string, Country[]>>({});
	const [loading, setLoading] = useState(true);
	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = contentRef.current;
		if (!container) return;

		const handleScroll = () => {
			setShowScrollToTop(container.scrollTop > 300);
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToTop = () => {
		contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
	};

	useEffect(() => {
		const fetchCountries = async () => {
			try {
				const res = await fetch("https://restcountries.com/v3.1/all?fields=flags,name,cca2,region,subregion", {
					cache: "force-cache",
					headers: { Accept: "application/json" },
				});
				const data: Country[] = await res.json();

				// Nach Kontinenten gruppieren
				const grouped: Record<string, Country[]> = {};
				data.forEach((country) => {
					const region = country.region || "Unknown";
					if (!grouped[region]) {
						grouped[region] = [];
					}
					grouped[region].push(country);
				});

				// Sortieren: Innerhalb jedes Kontinents alphabetisch nach deutschen Namen
				Object.keys(grouped).forEach((key) => {
					grouped[key].sort((a, b) => {
						const nameA = getGermanName(a.name.common);
						const nameB = getGermanName(b.name.common);
						return nameA.localeCompare(nameB, "de");
					});
				});

				setGroupedByContinent(grouped);
				setCountries(data);
				setLoading(false);
			} catch (e) {
				console.error("Fehler beim Laden der Länder:", e);
				setLoading(false);
			}
		};

		fetchCountries();
	}, []);

	const continentOrder = ["Europe", "Asia", "Africa", "Americas", "Oceania", "Antarctic"];

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
		<div className="relative flex flex-col md:flex-row min-h-dvh w-full bg-black">
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
			<div ref={contentRef} className="relative z-12 flex flex-1 flex-col overflow-y-auto bg-black px-4 py-24 md:py-32">
				<div
					className={cn(
						"pointer-events-none absolute inset-0 z-0 bg-black",
						"[background-size:20px_20px]",
						"[background-image:radial-gradient(#ffffff_1px,transparent_1px)]",
					)}
				/>
				{/* Radial gradient for the container to give a faded look */}
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

				<div className="relative z-10 w-full max-w-7xl mx-auto">
					<h1 className="text-4xl font-bold text-white mb-8 text-center">Alle Flaggen</h1>

					{loading ? (
						<div className="text-center text-white">
							<p>Lädt...</p>
						</div>
					) : (
						<div className="space-y-12">
							{continentOrder.map((continent) => {
								const countriesInContinent = groupedByContinent[continent] || [];
								if (countriesInContinent.length === 0) return null;

								return (
									<div key={continent} className="space-y-6">
										<h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">
											{continentNames[continent] || continent}
										</h2>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
											{countriesInContinent.map((country) => (
												<Card
													key={country.cca2}
													className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 transition-colors"
												>
													<CardContent className="p-4 space-y-3">
														<div className="aspect-[3/2] flex items-center justify-center">
															{country.flags?.svg || country.flags?.png ? (
																<img
																	src={country.flags.svg || country.flags.png}
																	alt={getGermanName(country.name.common)}
																	className="w-full h-full object-contain"
																/>
															) : (
																<span className="text-white/50 text-xs">Keine Flagge</span>
															)}
														</div>
														<h3 className="text-sm font-medium text-white text-center line-clamp-2">
															{getGermanName(country.name.common)}
														</h3>
													</CardContent>
												</Card>
											))}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Scroll-to-top Button */}
				{showScrollToTop && (
					<div className="fixed bottom-8 right-6 md:right-16 lg:right-24 xl:right-32 2xl:right-40 z-50">
						<Button
							variant="outline"
							size="icon"
							aria-label="Nach oben scrollen"
							onClick={scrollToTop}
							className="bg-black/90 border-white/30 hover:bg-black hover:border-white/50 backdrop-blur-md shadow-lg transition-all w-14 h-14"
						>
							<ArrowUp className="h-6 w-6 text-white" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

