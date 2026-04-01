import { Suspense } from "react";
import ResultsPage from "./page-client";

export default function ResultsPageWrapper() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                </main>
            }
        >
            <ResultsPage />
        </Suspense>
    );
}
