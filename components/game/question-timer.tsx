"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface QuestionTimerProps {
    /** Total duration of a question in seconds (used as the visual scale). */
    duration?: number;
    /** Whether the countdown is currently running. */
    isActive: boolean;
    /** Changing this value restarts the countdown. */
    resetKey: string | number;
    /** Seconds to start counting down from (used when resuming a saved game). Defaults to `duration`. */
    startFrom?: number;
    /** Called exactly once when the countdown reaches 0. */
    onTimeout: () => void;
    /** Reports the remaining seconds on every tick (for persistence). */
    onTick?: (remaining: number) => void;
}

/**
 * A wall-clock based countdown bar shown above a question.
 * Because it is driven by an absolute deadline it cannot be paused by
 * backgrounding the tab, which keeps the time pressure honest (Issue #14).
 */
export function QuestionTimer({
    duration = 12,
    isActive,
    resetKey,
    startFrom,
    onTimeout,
    onTick,
}: QuestionTimerProps) {
    const [remaining, setRemaining] = useState(startFrom ?? duration);
    const deadlineRef = useRef<number>(0);
    const firedRef = useRef(false);
    const onTimeoutRef = useRef(onTimeout);
    const onTickRef = useRef(onTick);
    onTimeoutRef.current = onTimeout;
    onTickRef.current = onTick;

    // Restart the countdown whenever a new question is shown.
    useEffect(() => {
        const startSeconds = startFrom ?? duration;
        firedRef.current = false;
        deadlineRef.current = Date.now() + startSeconds * 1000;
        setRemaining(startSeconds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    useEffect(() => {
        if (!isActive) return;

        const tick = () => {
            const next = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
            setRemaining(next);
            onTickRef.current?.(next);
            if (next <= 0 && !firedRef.current) {
                firedRef.current = true;
                clearInterval(id);
                onTimeoutRef.current();
            }
        };

        const id = setInterval(tick, 100);
        return () => clearInterval(id);
    }, [isActive, resetKey]);

    const pct = Math.max(0, Math.min(100, (remaining / duration) * 100));
    const secondsLeft = Math.ceil(remaining);
    const urgent = remaining <= 4;
    const warning = remaining <= 7 && remaining > 4;

    return (
        <div className="mx-auto w-full max-w-md">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-neutral-400">Zeit</span>
                <span
                    className={cn(
                        "text-sm font-bold tabular-nums",
                        urgent ? "text-red-400" : warning ? "text-yellow-400" : "text-green-400"
                    )}
                >
                    {secondsLeft}s
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                    className={cn(
                        "h-full rounded-full transition-[width] duration-100 ease-linear",
                        urgent ? "bg-red-500" : warning ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/** Shared question duration (seconds) used across all single player modes. */
export const QUESTION_DURATION = 12;
