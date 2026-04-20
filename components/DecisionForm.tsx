"use client";

import { type FormEvent, useState } from "react";
import { analysisModes, type AnalysisMode } from "@/lib/types";

type DecisionFormProps = {
  onSubmit: (input: {
    decision: string;
    context: string;
    mode: AnalysisMode;
  }) => Promise<void>;
  onClear: () => void;
  isLoading: boolean;
};

const sampleDecision =
  "Should I leave my current job to join an early-stage startup?";

export function DecisionForm({ onSubmit, onClear, isLoading }: DecisionFormProps) {
  const [decision, setDecision] = useState("");
  const [context, setContext] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("Balanced");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      decision: decision.trim(),
      context: context.trim(),
      mode,
    });
  }

  function handleClear() {
    setDecision("");
    setContext("");
    setMode("Balanced");
    onClear();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="decision" className="block text-sm font-medium text-stone-900">
          What decision are you considering?
        </label>
        <textarea
          id="decision"
          value={decision}
          onChange={(event) => setDecision(event.target.value)}
          placeholder={sampleDecision}
          rows={6}
          required
          className="min-h-44 w-full resize-y rounded border border-stone-300 bg-white px-3 py-3 text-base text-stone-950 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="context" className="block text-sm font-medium text-stone-900">
          Context
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="Optional details: constraints, timing, budget, people affected, what you have already tried."
          rows={3}
          className="w-full resize-y rounded border border-stone-300 bg-white px-3 py-3 text-base text-stone-950 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="mode" className="block text-sm font-medium text-stone-900">
          Analysis mode
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as AnalysisMode)}
          className="w-full rounded border border-stone-300 bg-white px-3 py-3 text-base text-stone-950 outline-none transition focus:border-stone-700 focus:ring-2 focus:ring-stone-200"
        >
          {analysisModes.map((analysisMode) => (
            <option key={analysisMode} value={analysisMode}>
              {analysisMode}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="rounded border border-stone-300 px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-stone-400"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
