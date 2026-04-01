import Link from "next/link";
import {
  Upload,
  BarChart3,
  Zap,
  ArrowRight,
  TrendingUp,
  Utensils,
  Footprints,
} from "lucide-react";
import { DemoPreview } from "./components/demo-preview";
import { Brand } from "./components/brand";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Brand compact />
          <div className="flex items-center gap-3">
            <Link href="/demo" className="btn-secondary text-xs py-2 px-4">
              Try Demo
            </Link>
            <Link href="/upload" className="btn-primary text-xs py-2 px-4">
              Upload Data
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 badge bg-[var(--color-accent-subtle)] text-[var(--color-accent-hover)] mb-6">
            <Zap className="w-3 h-3" />
            Exploratory Glucose Analytics
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Understand How Food
            <br />
            <span className="gradient-text">Affects Your Glucose</span>
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your Abbott FreeStyle Libre data and discover which meals
            seem associated with spikes, which foods appear gentler on your
            glucose, and whether walks after meals might help.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/demo" className="btn-primary text-base px-8 py-3">
              <BarChart3 className="w-4 h-4" />
              Try the Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/upload" className="btn-secondary text-base px-8 py-3">
              <Upload className="w-4 h-4" />
              Upload Your Data
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-meal-bg)] flex items-center justify-center mb-4">
              <Utensils className="w-5 h-5 text-[var(--color-meal)]" />
            </div>
            <h3 className="font-semibold mb-2">Meal Impact Analysis</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              See which foods appear associated with glucose spikes and which
              seem to produce milder responses.
            </p>
          </div>
          <div className="card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-workout-bg)] flex items-center justify-center mb-4">
              <Footprints className="w-5 h-5 text-[var(--color-workout)]" />
            </div>
            <h3 className="font-semibold mb-2">Exercise Correlation</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Explore whether walks or workouts near meals seem correlated with
              different glucose patterns.
            </p>
          </div>
          <div className="card animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-semibold mb-2">Deterministic Analytics</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              All spike detection and impact scoring uses transparent,
              deterministic algorithms — no black-box ML.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">See It In Action</h2>
            <p className="text-[var(--color-text-secondary)]">
              Built-in demo with 3 days of sample data
            </p>
          </div>
          <DemoPreview />
        </div>
      </section>

      {/* How It Works */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
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
          <div>Glucose Coral</div>
          <p>Exploratory analytics tool — not medical advice</p>
        </div>
      </footer>
    </main>
  );
}
