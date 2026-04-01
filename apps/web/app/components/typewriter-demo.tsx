"use client";

import { useEffect, useState, useRef } from "react";
import { Utensils, Footprints, Moon, Sparkles } from "lucide-react";

const DEMO_TEXT = `slept 11pm → 7am

9h17: 1 raw carrot

13h (Japanese restaurant):
- miso soup + cabbage salad
- 16 california rolls (shrimp/avocado)
- finished at 13h35
walk from 13h35 to 13h45

15h50: resistance training til 17h20,
       then 10 min walk

18h58:
- 500g boiled potatoes
- 200g chicken breast
- olive oil, herbs, 4 tsp honey
- 50g coconut flakes, 1 mandarine
- finished at 20h01`;

interface ParsedCard {
    icon: "sleep" | "meal" | "workout";
    label: string;
    sublabel: string;
    macros?: string;
    color: string;
}

const PARSED_CARDS: ParsedCard[] = [
    { icon: "sleep", label: "Sleep", sublabel: "11:00 PM → 7:00 AM · 8 h", color: "var(--color-glucose)" },
    { icon: "meal", label: "Snack · 9:17 AM", sublabel: "Raw carrot · ~7g carbs", color: "var(--color-meal)" },
    { icon: "meal", label: "Lunch · 1:00 PM", sublabel: "Miso soup, cabbage, 16 california rolls", macros: "~68g carbs · 22g protein · 14g fat", color: "var(--color-meal)" },
    { icon: "workout", label: "Walk · 1:35 PM", sublabel: "10 min", color: "var(--color-workout)" },
    { icon: "workout", label: "Resistance + Walk · 3:50 PM", sublabel: "Resistance ~90 min, walk 10 min", color: "var(--color-workout)" },
    { icon: "meal", label: "Dinner · 6:58 PM", sublabel: "Potatoes, chicken, coconut, mandarin", macros: "~138g carbs · 52g protein · 22g fat", color: "var(--color-meal)" },
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
