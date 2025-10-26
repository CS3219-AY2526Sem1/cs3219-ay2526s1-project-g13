import { Question } from "@/types/question";

export async function fetchQuestion(id: string): Promise<Question> {
  // Call question service backend here to fetch a specific question
  try {
    // Simulate API delay
    console.log("Fetching question with id:", id);
    const response = await new Promise<Question>((resolve) =>
      setTimeout(
        () =>
          resolve({
            title: "Fetched Question Title",
            topic: "Fetched Topic",
            difficulty: "Medium",
            details: "Details fetched from backend",
            suggestedSolution: "Suggested solution fetched",
          }),
        500,
      ),
    );

    return response;
  } catch (error) {
    console.error("Failed to fetch question:", error);
    throw error;
  }
}

export async function fetchQuestionList(): Promise<Question[]> {
  // Call question service backend here to fetch questions
  return [
    {
      id: "1",
      title: "Question 1",
      topic: "Array",
      difficulty: "Easy",
    },
    {
      id: "2",
      title: "Question 2",
      topic: "Strings",
      difficulty: "Medium",
    },
    {
      id: "3",
      title: "Question 3",
      topic: "Linked list",
      difficulty: "Hard",
    },
  ];
}

export async function addQuestion(question: Question): Promise<Question> {
  try {
    console.log("Adding question:", question);
    return question;
  } catch (error) {
    console.error("Failed to add question:", error);
    throw error;
  }
}

export async function editQuestion(question: Question): Promise<Question> {
  try {
    console.log("Editing question:", question);
    return question;
  } catch (error) {
    console.error("Failed to edit question:", error);
    throw error;
  }
}

export async function archiveQuestion(question: Question): Promise<Question> {
  try {
    console.log("Archiving question:", question);
    return question;
  } catch (error) {
    console.error("Failed to archive question:", error);
    throw error;
  }
}

export async function deleteQuestion(question: Question): Promise<Question> {
  try {
    console.log("Deleting question:", question);
    return question;
  } catch (error) {
    console.error("Failed to delete question:", error);
    throw error;
  }
}
