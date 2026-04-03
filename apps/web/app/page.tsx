import Link from "next/link";
import { Upload, Zap } from "lucide-react";
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

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)] mb-6">
            <Zap className="w-3 h-3" />
            Exploratory Glucose Analytics
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Understand How Food
            <br />
            <span className="gradient-text">Affects Your Glucose</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your Abbott FreeStyle Libre data and discover which meals
            seem associated with spikes, which foods appear gentler on your
            glucose, and whether walks after meals might help.
          </p>
          <Link href="/upload" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Your Data
          </Link>
        </div>
      </section>

      {/* Notes → AI (full width, stacked — not side-by-side with chart) */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-mono text-[var(--color-text-muted)] mb-2">
            notes.txt
          </p>
          <h2
            className="text-center text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Parsed by AI
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8 text-sm">
            Type freely in any language — meals, workouts, and sleep become
            structured events with macro estimates.
          </p>
          <TypewriterDemo />
        </div>
      </section>

      {/* Demo chart — below notes, full width */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <DemoPreview />
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
