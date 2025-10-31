"use client";

import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const NavigationMenu = React.forwardRef<
	React.ElementRef<typeof NavigationMenuPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
    <NavigationMenuPrimitive.Root
		ref={ref}
		className={cn("relative z-50 flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    >
      {children}
		<NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
	React.ElementRef<typeof NavigationMenuPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.List
		ref={ref}
      className={cn(
			"group flex list-none items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 p-1 text-sm backdrop-blur-sm dark:border-white/10",
			className,
      )}
      {...props}
    />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const NavigationMenuTrigger = React.forwardRef<
	React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<NavigationMenuPrimitive.Trigger
		ref={ref}
		className={cn(
			"group inline-flex select-none items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white outline-none transition-colors hover:bg-white/10",
  className,
		)}
      {...props}
    >
		{children}
		<ChevronDown className="ml-1 size-4 transition-transform group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
	React.ElementRef<typeof NavigationMenuPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Content
		ref={ref}
      className={cn(
			"left-0 top-0 w-auto rounded-md border border-white/10 bg-black/80 p-4 text-white shadow-lg backdrop-blur-md data-[motion=from-start]:animate-in data-[motion=from-start]:fade-in-0 data-[motion=from-start]:zoom-in-95",
			className,
      )}
      {...props}
    />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef<
	React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
	React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
	<div className="absolute left-0 top-full flex w-full justify-center">
      <NavigationMenuPrimitive.Viewport
			ref={ref}
        className={cn(
				"origin-top-center rounded-md border border-white/10 bg-black/80 text-white shadow-lg backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
				className,
        )}
        {...props}
      />
    </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

function navigationMenuTriggerStyle() {
	return "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/10";
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
    navigationMenuTriggerStyle,
  NavigationMenuViewport,
}
