"use client";

import Link from "next/link";
import {
	NavigationMenuItem,
	NavigationMenuLink,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type NavMenuItemProps = {
	href: string;
	children: React.ReactNode;
	external?: boolean;
};

export default function NavMenuItem({ href, children, external }: NavMenuItemProps) {
	return (
		<NavigationMenuItem>
			<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
				{external ? (
					<a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
				) : (
					<Link href={href}>{children}</Link>
				)}
			</NavigationMenuLink>
		</NavigationMenuItem>
	);
}


