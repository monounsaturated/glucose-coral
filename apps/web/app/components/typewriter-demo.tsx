"use client";

import { useEffect, useState, useRef } from "react";
import { Utensils, Footprints, Moon, Sparkles } from "lucide-react";

const DEMO_TEXT = `9:05am : 1 banana, 2 eggs and a cookies and cream clif bar
12:32pm :
- miso soup, cabbage salad, a regular bowl of rice and 12 salmon sashimi
1:30pm : 20mn walk
4:10pm : 1 pear and 5 walnuts
7:10pm : 1 medium sweet potato, half an avocado, around 150 grams of chicken and a slice of apple pie`;

interface ParsedCard {
    icon: "sleep" | "meal" | "workout";
    label: string;
    sublabel: string;
    macros?: string;
    color: string;
}

const PARSED_CARDS: ParsedCard[] = [
    {
        icon: "meal",
        label: "Breakfast · 9:05 AM",
        sublabel: "Banana, 2 eggs, cookies & cream Clif bar",
        macros: "~74g carbs · 31g protein · 18g fat",
        color: "var(--color-meal)",
    },
    {
        icon: "meal",
        label: "Lunch · 12:32 PM",
        sublabel: "Miso soup, cabbage salad, rice, 12 salmon sashimi",
        macros: "~82g carbs · 44g protein · 17g fat",
        color: "var(--color-meal)",
    },
    { icon: "workout", label: "Walk · 1:30 PM", sublabel: "20 min", color: "var(--color-workout)" },
    {
        icon: "meal",
        label: "Snack · 4:10 PM",
        sublabel: "Pear + 5 walnuts",
        macros: "~29g carbs · 4g protein · 10g fat",
        color: "var(--color-meal)",
    },
    {
        icon: "meal",
        label: "Dinner · 7:10 PM",
        sublabel: "Sweet potato, avocado, chicken, apple pie",
        macros: "~93g carbs · 39g protein · 23g fat",
        color: "var(--color-meal)",
    },
];

export function TypewriterDemo() {
    const [displayed, setDisplayed] = useState("");
    const [phase, setPhase] = useState<"typing" | "parsing" | "done">("typing");
    const [visibleCards, setVisibleCards] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        let i = 0;
        intervalRef.current = setInterval(() => {
            i++;
            setDisplayed(DEMO_TEXT.slice(0, i));
            if (i >= DEMO_TEXT.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setTimeout(() => setPhase("parsing"), 400);
                setTimeout(() => {
                    setPhase("done");
                    let cardIdx = 0;
                    const cardInterval = setInterval(() => {
                        cardIdx++;
                        setVisibleCards(cardIdx);
                        if (cardIdx >= PARSED_CARDS.length) clearInterval(cardInterval);
                    }, 120);
                }, 1200);
            }
        }, 18);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Input side */}
            <div className="card" style={{ padding: "0" }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
                    <span className="w-3 h-3 rounded-full bg-[var(--color-spike-high)] opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-[var(--color-spike-moderate)] opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-[var(--color-spike-low)] opacity-80" />
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">notes.txt</span>
                </div>
                <div className="p-4 font-mono text-xs leading-relaxed text-[var(--color-text-secondary)] min-h-64 relative">
                    <pre className="whitespace-pre-wrap break-words">{displayed}
                        {phase === "typing" && (
                            <span className="inline-block w-0.5 h-3.5 bg-[var(--color-accent)] ml-0.5 animate-pulse" />
                        )}
                    </pre>
                </div>
            </div>

            {/* Parsed output side */}
            <div className="space-y-2 min-h-64">
                {phase === "typing" && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] pt-8 justify-center">
                        <Sparkles className="w-4 h-4" />
                        <span>Paste notes in any language…</span>
                    </div>
                )}

                {phase === "parsing" && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-accent)] pt-8 justify-center">
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Parsing with AI…</span>
                    </div>
                )}

                {phase === "done" && PARSED_CARDS.slice(0, visibleCards).map((card, i) => (
                    <div
                        key={i}
                        className="card animate-fade-in flex items-start gap-3"
                        style={{ padding: "0.75rem 1rem", animationDuration: "0.3s" }}
                    >
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${card.color}22` }}
                        >
                            {card.icon === "sleep" && <Moon className="w-4 h-4" style={{ color: card.color }} />}
                            {card.icon === "meal" && <Utensils className="w-4 h-4" style={{ color: card.color }} />}
                            {card.icon === "workout" && <Footprints className="w-4 h-4" style={{ color: card.color }} />}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight">{card.label}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-tight">{card.sublabel}</p>
                            {card.macros && (
                                <p className="text-xs mt-0.5" style={{ color: card.color, opacity: 0.8 }}>{card.macros}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
