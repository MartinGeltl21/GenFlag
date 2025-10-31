import { cn } from "@/lib/utils";
import React from "react";

export function GridBackground({ className }: { className?: string }) {
	return (
		<div className={cn("relative flex min-h-dvh w-full items-center justify-center bg-black", className)}>
			<div
				className={cn(
					"absolute inset-0 opacity-30",
					"[background-size:40px_40px]",
					"[background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)]"
				)}
			/>
			{/* Radial gradient for the container to give a faded look - stärkerer Vignetteneffekt */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_80%)]"></div>
		</div>
	);
}

export function DotBackground({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"absolute inset-0 z-0 bg-black [background-image:radial-gradient(circle_at_1px_1px,rgb(255,255,255,0.15)_1px,transparent_0)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]",
				className
			)}
		/>
	);
}

