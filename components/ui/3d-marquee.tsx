"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Hook for mobile detection
const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(false);
	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);
	return isMobile;
};

export const ThreeDMarquee = ({
	images,
	className,
}: {
	images: string[];
	className?: string;
}) => {
	const isMobile = useIsMobile();

	// Reduce images on mobile for better performance
	const displayImages = isMobile ? images.slice(0, 16) : images;

	// Split the images array into 4 equal parts
	const chunkSize = Math.ceil(displayImages.length / 4);
	const chunks = Array.from({ length: 4 }, (_, colIndex) => {
		const start = colIndex * chunkSize;
		return displayImages.slice(start, start + chunkSize);
	});

	return (
		<div
			className={cn(
				"block h-dvh w-full overflow-hidden",
				className,
			)}
		>
			<div className="flex size-full items-center justify-center">
				<div className={cn(
					"shrink-0",
					isMobile
						? "size-[1600px] scale-50"
						: "size-[2600px] scale-75 md:scale-100 xl:scale-[1.15]"
				)}>
					<div
						style={{
							// Simplified 2D transform on mobile, full 3D on desktop
							transform: isMobile
								? "rotate(-45deg)"
								: "rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
							// GPU acceleration hints
							willChange: "transform",
							backfaceVisibility: "hidden",
						}}
						className="relative top-[40rem] right-[60%] grid size-full origin-top-left grid-cols-4 gap-8 transform-3d"
					>
						{chunks.map((subarray, colIndex) => (
							<motion.div
								animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
								transition={{
									// Slower animation on mobile = less frames to render
									duration: isMobile ? 25 : (colIndex % 2 === 0 ? 10 : 15),
									repeat: Infinity,
									repeatType: "reverse",
								}}
								key={colIndex + "marquee"}
								className="flex flex-col items-start gap-8"
								style={{
									willChange: "transform",
									transform: "translateZ(0)", // Force GPU layer
								}}
							>
								{/* Hide grid lines on mobile for better performance */}
								{!isMobile && <GridLineVertical className="-left-4" offset="80px" />}
								{subarray.map((image, imageIndex) => (
									<div className="relative" key={imageIndex + image}>
										{!isMobile && <GridLineHorizontal className="-top-4" offset="20px" />}
										<img
											src={image}
											alt={`Image ${imageIndex + 1}`}
											className={cn(
												"aspect-[970/700] rounded-lg object-cover",
												isMobile
													? "brightness-[0.4]" // Simplified styling on mobile
													: "ring ring-gray-950/5 hover:shadow-2xl brightness-[0.4] contrast-110"
											)}
											width={isMobile ? 485 : 970}
											height={isMobile ? 350 : 700}
											loading="lazy"
										/>
									</div>
								))}
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

const GridLineHorizontal = ({
	className,
	offset,
}: {
	className?: string;
	offset?: string;
}) => {
	return (
		<div
			style={
				{
					"--background": "#ffffff",
					"--color": "rgba(0, 0, 0, 0.2)",
					"--height": "1px",
					"--width": "5px",
					"--fade-stop": "90%",
					"--offset": offset || "200px", //-100px if you want to keep the line inside
					"--color-dark": "rgba(255, 255, 255, 0.2)",
					maskComposite: "exclude",
				} as React.CSSProperties
			}
			className={cn(
				"absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
				"bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
				"[background-size:var(--width)_var(--height)]",
				"[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
				"[mask-composite:exclude]",
				"z-30",
				"dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
				className,
			)}
		></div>
	);
};

const GridLineVertical = ({
	className,
	offset,
}: {
	className?: string;
	offset?: string;
}) => {
	return (
		<div
			style={
				{
					"--background": "#ffffff",
					"--color": "rgba(0, 0, 0, 0.2)",
					"--height": "5px",
					"--width": "1px",
					"--fade-stop": "90%",
					"--offset": offset || "150px", //-100px if you want to keep the line inside
					"--color-dark": "rgba(255, 255, 255, 0.2)",
					maskComposite: "exclude",
				} as React.CSSProperties
			}
			className={cn(
				"absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
				"bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
				"[background-size:var(--width)_var(--height)]",
				"[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
				"[mask-composite:exclude]",
				"z-30",
				"dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
				className,
			)}
		></div>
	);
};



