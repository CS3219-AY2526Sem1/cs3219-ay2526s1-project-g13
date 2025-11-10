export type Question = {
  id?: string;
  title: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  details?: string;
  suggestedSolution?: string;
};

export const emptyQuestionState: Question = {
  id: "",
  title: "",
  topic: "",
  difficulty: "Easy",
  details: "",
  suggestedSolution: "",
};
