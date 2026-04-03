import Link from "next/link";
import { Upload } from "lucide-react";
import { DemoPreview } from "./components/demo-preview";
import { Brand } from "./components/brand";
import { TypewriterDemo } from "./components/typewriter-demo";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brand />
          </div>
          <Link href="/upload" className="btn-primary text-xs py-2 px-4">
            <Upload className="w-4 h-4" />
            Upload Your Data
          </Link>
        </div>
      </nav>

      {/* Hero + media — tuned to fit one viewport on common laptop sizes */}
      <section className="min-h-[100dvh] pt-[4.5rem] px-6 pb-6 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 min-h-0">
          <div className="text-center shrink-0 mb-4 md:mb-5 animate-fade-in">
            <h1
              className="text-3xl md:text-5xl font-bold tracking-tight mb-3 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Just Write Your Notes
            </h1>
            <p className="text-sm md:text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-5 leading-relaxed">
              Type freely in any language : AI parses meals, workouts, and sleep
              into structured data with macro estimates.
            </p>
            <Link href="/upload" className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Your Data
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 flex-1 min-h-0 items-stretch">
            <TypewriterDemo compact />
            <DemoPreview compact />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: "var(--font-display)" }}>How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Upload CSV", desc: "Abbott FreeStyle Libre export" },
              { step: "2", title: "Choose Mode", desc: "Meals from CSV or separate document" },
              { step: "3", title: "Analyze", desc: "Deterministic spike detection runs instantly" },
              { step: "4", title: "Explore", desc: "Interactive charts and per-meal metrics" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Inputs */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto card">
          <h3 className="font-semibold mb-4">Supported Inputs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-text-secondary)] mb-2">Required</p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-glucose)]" />
                Abbott FreeStyle Libre CSV (up to 10 MB)
              </p>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)] mb-2">
                Optional (for separate meal notes)
              </p>
              <div className="space-y-1">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-meal)]" />
                  .txt or .md meal/workout notes
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-meal)]" />
                  Text-based .pdf (up to 2 MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="pb-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            This is an exploratory tool, not a medical device. All analytics show
            correlations, not causation. Results should not be used for medical
            decisions. Consult a healthcare professional for medical advice.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
            Glucose Coral
          </div>
          <p>Exploratory analytics tool — not medical advice</p>
        </div>
      </footer>
    </main>
  );
}
