import { questionAPI } from "@/lib/api-client";
export async function fetchTopics(): Promise<string[]> {
  try {
    console.log("Fetching topics:");

    // Simulate API delay
    const topics = await questionAPI.getTopicList();

    console.log("Topics array:", topics);
    return topics;
  } catch (error) {
    console.error("Failed to fetch topics:", error);
    throw error;
  }
}
