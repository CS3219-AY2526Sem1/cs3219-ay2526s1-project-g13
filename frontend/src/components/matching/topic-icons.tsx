import { fetchTopics } from "@/hooks/use-question-topic";

let fetchedTopics: string[] = [];

try {
  fetchedTopics = await fetchTopics();
  console.log("Fetched topics:", fetchedTopics);
} catch (error) {
  console.warn("Failed to fetch topics, using fallback:", error);
  fetchedTopics = ["Array"];
}

export const topics = fetchedTopics.map((name) => ({
  id: name.toUpperCase().replace(/\s+/g, "_"),
  name,
}));
