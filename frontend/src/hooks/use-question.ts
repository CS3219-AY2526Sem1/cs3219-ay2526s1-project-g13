import { Question, questionAPI, ArchiveQuestionResponse, Solution } from "@/lib/api-client";

export async function fetchQuestion(id: string): Promise<Question> {
  try {
    return await questionAPI.getQuestionById(id);
  } catch (error) {
    console.error("Failed to fetch question:", error);
    throw error;
  }
}

export async function fetchQuestionList(): Promise<Question[]> {
  try {
    return await questionAPI.getQuestionList();
  } catch (error) {
    console.error("Failed to fetch question list:", error);
    throw error;
  }
}

export async function addQuestion(question: Question): Promise<Question> {
  try {
    return await questionAPI.createQuestion(question);
  } catch (error) {
    console.error("Failed to add question:", error);
    throw error;
  }
}

export async function editQuestion(question: Question): Promise<Question> {
  try {
    if (!question._id) throw new Error("editQuestion requires question.id");
    console.log(question);
    return await questionAPI.updateQuestion(question._id, question);
  } catch (error) {
    console.error("Failed to edit question:", error);
    throw error;
  }
}

export async function archiveQuestion(questionId: string): Promise<ArchiveQuestionResponse> {
  try {
    if (!questionId) throw new Error("archiveQuestion requires question.id");
    return await questionAPI.archiveQuestion(questionId);
  } catch (error) {
    console.error("Failed to archive question:", error);
    throw error;
  }
}

export async function fetchSolutionsByQuestion(questionId: string): Promise<Solution[]> {
  try {
    if (!questionId) throw new Error("fetchSolution requires question.id");
    return await questionAPI.getSolutionsForQuestion(questionId);
  } catch (error) {
    console.error("Failed to fetch solutions:", error);
    throw error;
  }
}
