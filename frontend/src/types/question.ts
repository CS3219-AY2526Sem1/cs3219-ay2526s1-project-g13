export type Question = {
  id?: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  details?: string;
  suggestedSolution?: string;
};
