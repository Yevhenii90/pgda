"use client";

import { useEffect, useState } from "react";
import { AnalysisResult } from "@/components/AnalysisResult";
import { DecisionForm } from "@/components/DecisionForm";
import { HistoryList } from "@/components/HistoryList";
import { addHistoryItem, loadHistory, saveHistory } from "@/lib/storage";
import {
  type AnalysisMode,
  type AnalysisResult as AnalysisResultType,
  type HistoryItem,
  isAnalysisResult,
} from "@/lib/types";

type AnalyzeInput = {
  decision: string;
  context: string;
  mode: AnalysisMode;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [result, setResult] = useState<AnalysisResultType | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setHistory(loadHistory());
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  function updateHistory(items: HistoryItem[]) {
    setHistory(items);
    saveHistory(items);
  }

  async function handleAnalyze(input: AnalyzeInput) {
    if (!input.decision) {
      setError("Enter a decision before analyzing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Analysis failed.");
      }

      if (!isAnalysisResult(data.result)) {
        throw new Error("The analysis response was incomplete. Try again.");
      }

      const nextResult = data.result;
      const item: HistoryItem = {
        id: createId(),
        decision: input.decision,
        context: input.context,
        mode: input.mode,
        result: nextResult,
        createdAt: new Date().toISOString(),
      };

      setResult(nextResult);
      updateHistory(addHistoryItem(history, item));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while analyzing this decision.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleClear() {
    setResult(null);
    setError(null);
  }

  function handleOpenHistory(item: HistoryItem) {
    setResult(item.result);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDeleteHistory(id: string) {
    updateHistory(history.filter((item) => item.id !== id));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
          Decision Debugger
        </h1>
      </header>

      <section className="rounded border border-stone-200 bg-white p-4 sm:p-6">
        <DecisionForm
          onSubmit={handleAnalyze}
          onClear={handleClear}
          isLoading={isLoading}
        />
      </section>

      <AnalysisResult result={result} isLoading={isLoading} error={error} />

      <HistoryList
        items={history}
        onOpen={handleOpenHistory}
        onDelete={handleDeleteHistory}
      />
    </main>
  );
}
