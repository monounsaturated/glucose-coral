"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "../components/brand";
import { Activity, Upload, FileText, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function UploadPage() {
    const router = useRouter();
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [isDocumentMode, setIsDocumentMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCsvDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.name.toLowerCase().endsWith(".csv")) {
            setCsvFile(file);
            setError(null);
        } else {
            setError("Please upload a .csv file");
        }
    }, []);

    const handleCsvSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    setError("CSV file is too large (max 10 MB)");
                    return;
                }
                setCsvFile(file);
                setError(null);
            }
        },
        []
    );

    const handleDocSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    setError("Document file is too large (max 2 MB)");
                    return;
                }
                const ext = file.name.split(".").pop()?.toLowerCase();
                if (!["txt", "md", "pdf"].includes(ext ?? "")) {
                    setError("Please upload a .txt, .md, or .pdf file");
                    return;
                }
                setDocumentFile(file);
                setError(null);
            }
        },
        []
    );

    const canSubmit =
        csvFile && (!isDocumentMode || documentFile) && !isLoading;

    const handleSubmit = async () => {
        if (!canSubmit || !csvFile) return;
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("csv", csvFile);
            formData.append("mode", isDocumentMode ? "document-food" : "csv-food");
            if (documentFile && isDocumentMode) {
                formData.append("document", documentFile);
            }

            const res = await fetch("/api/analyze", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Analysis failed");
            }

            const data = await res.json();
            // Store result in sessionStorage for the results page
            sessionStorage.setItem(`analysis-${data.id}`, JSON.stringify(data));
            router.push(`/results?id=${data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 glass">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Brand />
                    </Link>
                    <Link href="/demo" className="btn-secondary text-xs py-2 px-4">
                        Try Demo
                    </Link>
                </div>
            </nav>

            <div className="pt-24 pb-20 px-6 max-w-2xl mx-auto">
                <Link
                    href="/"
                    className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-4 transition-colors"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Back to home
                </Link>

                <h1 className="text-2xl font-bold mb-2">Upload Your Data</h1>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                    Upload your Abbott FreeStyle Libre CSV to analyze your glucose responses.
                </p>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* CSV Upload */}
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-medium mb-3 block">
                            FreeStyle Libre CSV <span className="text-[var(--color-spike-high)]">*</span>
                        </label>
                        <div
                            onDrop={handleCsvDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className={`card border-dashed text-center py-10 cursor-pointer transition-all hover:border-[var(--color-border-hover)] ${csvFile ? "border-[var(--color-glucose)] bg-[var(--color-glucose-glow)]" : ""
                                }`}
                            onClick={() => document.getElementById("csv-input")?.click()}
                        >
                            <input
                                id="csv-input"
                                type="file"
                                accept=".csv"
                                onChange={handleCsvSelect}
                                className="hidden"
                            />
                            {csvFile ? (
                                <div>
                                    <FileText className="w-8 h-8 text-[var(--color-glucose)] mx-auto mb-2" />
                                    <p className="text-sm font-medium">{csvFile.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {(csvFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                        Drag and drop or click to select
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                        .csv files up to 10 MB
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="card">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDocumentMode}
                                onChange={(e) => {
                                    setIsDocumentMode(e.target.checked);
                                    if (!e.target.checked) setDocumentFile(null);
                                }}
                                className="mt-1 w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-surface-elevated)] accent-[var(--color-accent)]"
                            />
                            <div>
                                <p className="text-sm font-medium">
                                    My food data is NOT entered in my FreeStyle Libre document
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                    Check this if you track meals separately. You&apos;ll be asked to
                                    upload a meal/workout notes file.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Document Upload */}
                    {isDocumentMode && (
                        <div className="animate-slide-up">
                            <label className="text-sm font-medium mb-3 block">
                                Meal/Workout Notes <span className="text-[var(--color-spike-high)]">*</span>
                            </label>
                            <div
                                className={`card border-dashed text-center py-10 cursor-pointer transition-all hover:border-[var(--color-border-hover)] ${documentFile
                                        ? "border-[var(--color-meal)] bg-[var(--color-meal-bg)]"
                                        : ""
                                    }`}
                                onClick={() => document.getElementById("doc-input")?.click()}
                            >
                                <input
                                    id="doc-input"
                                    type="file"
                                    accept=".txt,.md,.pdf"
                                    onChange={handleDocSelect}
                                    className="hidden"
                                />
                                {documentFile ? (
                                    <div>
                                        <FileText className="w-8 h-8 text-[var(--color-meal)] mx-auto mb-2" />
                                        <p className="text-sm font-medium">{documentFile.name}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {(documentFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <FileText className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                                        <p className="text-sm text-[var(--color-text-secondary)]">
                                            Upload your meal/workout notes
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                            .txt, .md, or text-based .pdf up to 2 MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`btn-primary w-full justify-center py-3 text-base ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Activity className="w-4 h-4" />
                                Run Analysis
                            </>
                        )}
                    </button>
                </div>

                {/* Privacy Note */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed max-w-md mx-auto">
                        Your data is processed securely. Uploaded files are stored temporarily
                        and automatically deleted within 24 hours. No account is required.
                    </p>
                </div>
            </div>
        </main>
    );
}
