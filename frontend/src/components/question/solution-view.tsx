import { useEffect, useState } from "react";
import type { Solution } from "@/lib/api-client";
import { fetchSolutionsByQuestion } from "@/hooks/use-question";

type SolutionViewProps = {
  questionId: string;
  includeArchived?: boolean;
};

export function SolutionView({ questionId }: SolutionViewProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        if (!questionId) return;
        const res = await fetchSolutionsByQuestion(questionId);
        if (alive) setSolutions(res ?? []);
      } catch (e) {
        if (alive) setErr(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [questionId]);

  if (loading) return <p>Loading…</p>;
  if (err) return <p className="text-red-600">Failed to load solutions.</p>;
  if (solutions.length === 0) return <p>No solutions yet.</p>;

  return (
    <>
      {solutions.map((sol) => (
        <div key={sol._id} className="mb-6 border rounded p-4">
          <h3 className="font-semibold">{sol.language} Solution</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {sol.timeComplexity ?? "—"} • {sol.spaceComplexity ?? "—"}
          </p>
          <pre className="bg-muted p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
            {sol.code}
          </pre>
          <p className="mt-2">{sol.explanation}</p>
        </div>
      ))}
    </>
  );
}
