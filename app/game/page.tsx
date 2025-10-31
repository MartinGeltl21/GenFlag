"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GridBackground } from "@/components/ui/grid-background";
import { getGermanName } from "@/lib/countryNames";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconHome, IconFlag, IconInfoCircle, IconArrowLeft, IconDeviceGamepad } from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "motion/react";

interface Country {
	name: { common: string; official: string };
	flags: { svg?: string; png?: string };
	cca2: string;
}

export default function GamePage() {
	const [countries, setCountries] = useState<Country[]>([]);
	const [currentCountry, setCurrentCountry] = useState<Country | null>(null);
	const [options, setOptions] = useState<string[]>([]);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
	const [isAnswered, setIsAnswered] = useState(false);
	const [score, setScore] = useState(0);
	const [total, setTotal] = useState(0);

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

		// Zufälliges Land auswählen
		const randomCountry = countries[Math.floor(Math.random() * countries.length)];

		// 3 weitere zufällige Länder für die falschen Antworten
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

		// Optionen mischen (korrekte Antwort + 3 falsche) - alle in Deutsch
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
		}
	};

	const handleNext = () => {
		loadNewQuestion();
	};

	const getButtonClassName = (option: string) => {
		const base = "text-white font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 focus:outline-none transition-colors min-h-[56px] text-base";
		
		if (isAnswered && option === correctAnswer) {
			// Knalliges Grün für korrekte Antwort
			return cn(
				base,
				"bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
			);
		}

		if (isAnswered && option === selectedAnswer && option !== correctAnswer) {
			// Knalliges Rot für falsche Antwort
			return cn(
				base,
				"bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
			);
		}

		// Standard: Blaue Buttons wie im Beispiel
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
		<div className="relative flex h-dvh w-full overflow-hidden dark:bg-black">
			{/* Grid and Dot Background von Aceternity UI */}
			<GridBackground className="pointer-events-none absolute inset-0" />

			{/* Sidebar */}
			<Sidebar>
				<SidebarBody className="justify-between gap-10 bg-black/60 backdrop-blur-xl border-r border-white/10">
					<div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
						<div className="flex items-center space-x-2 py-2">
							<div className="h-6 w-7 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="font-medium whitespace-pre text-white text-base"
							>
								GenFlag
							</motion.span>
						</div>
						<div className="mt-8 flex flex-col gap-3">
							{sidebarLinks.map((link, idx) => (
								<SidebarLink key={idx} link={link} />
							))}
						</div>
					</div>
					<div>
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

			{/* Main Game Content */}
			<div className="relative z-12 flex flex-1 flex-col items-center justify-center overflow-hidden dark:bg-black px-4">
				<div className="w-full max-w-6xl mx-auto">
					{/* Hauptcontainer */}
					<div className="rounded-2xl border border-white/10 bg-black p-8 md:p-12 backdrop-blur-xl shadow-2xl pb-24">
						{currentCountry ? (
							<div className="space-y-12">
								{/* Score Anzeige */}
								<div className="text-center mb-8">
									<div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl">
										<span className="text-lg font-semibold text-white">
											Punkte: <span className="text-green-400">{score}</span> von {total}
										</span>
									</div>
								</div>

								{/* Flagge in der Mitte - ohne Rand */}
								<div className="flex items-center justify-center">
									<div className="relative w-full max-w-md aspect-[3/2] flex items-center justify-center">
										<img
											src={currentCountry.flags?.svg || currentCountry.flags?.png || ""}
											alt="Flagge"
											className="w-full h-full object-contain"
										/>
									</div>
								</div>

								{/* 4 Antwort-Buttons horizontal - kleiner horizontal, größer vertikal */}
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

								{/* Weiter-Button - Platzhalter damit Container nicht wächst */}
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

