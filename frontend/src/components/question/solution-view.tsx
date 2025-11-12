// solution-view.tsx
import { useEffect, useMemo, useState } from "react";
import type { Solution } from "@/lib/api-client";
import { fetchSolutionsByQuestion } from "@/hooks/use-question";
import { Language } from "@/types/solution";

type SolutionViewProps = {
  questionId: number;
  selectedLang: Language;
};

export function SolutionView({ questionId, selectedLang }: SolutionViewProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        if (!questionId) return;
        const res = await fetchSolutionsByQuestion(questionId);

        if (!alive) return;
        setSolutions(res ?? []);
      } catch (e) {
        console.log(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [questionId]);

  const activeSolution = useMemo(() => {
    if (!solutions || solutions.length === 0) return null;
    const exact = solutions.find(
      (s) => String(s.language).toLowerCase() === String(selectedLang).toLowerCase(),
    );
    return exact ?? solutions[0];
  }, [solutions, selectedLang]);

  if (loading) return <p>Loading…</p>;
  if (solutions.length === 0) return <p>No solutions yet.</p>;

  return (
    <div className="space-y-4">
      {!activeSolution ? (
        <p>No {selectedLang} solution found.</p>
      ) : (
        <div className="mb-6 border rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{activeSolution.language} Solution</h3>
            {activeSolution.status === "Archived" && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                Archived
              </span>
            )}
          </div>

          {(() => {
            const time = activeSolution.timeComplexity;
            const space = activeSolution.spaceComplexity;
            return (
              <p className="text-sm text-muted-foreground mb-2">
                {time ? (
                  <span className="mr-3">
                    <span className="font-medium">Time Complexity:</span> {time}
                  </span>
                ) : null}

                {space ? (
                  <span>
                    <span className="font-medium">Space Complexity:</span> {space}
                  </span>
                ) : null}
              </p>
            );
          })()}

          <pre className="bg-muted p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
            {activeSolution.code}
          </pre>

          {activeSolution.explanation && <p className="mt-2">{activeSolution.explanation}</p>}
        </div>
      )}
    </div>
  );
}
