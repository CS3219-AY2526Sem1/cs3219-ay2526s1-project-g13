import { Question } from "@/types/question";

/**
 * Simulates fetching a question from the backend.
 * You can later replace this with a real API call.
 */
export async function fetchQuestion(id: string): Promise<Question> {
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
