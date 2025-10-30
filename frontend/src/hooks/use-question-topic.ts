export async function fetchTopics(): Promise<string[]> {
  try {
    console.log("Fetching topics:");

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    const topics = ["Array", "Linked list", "Data Structure"];

    return topics;
  } catch (error) {
    console.error("Failed to fetch topics:", error);
    throw error;
  }
}

export async function addTopic(topic: string): Promise<string> {
  try {
    console.log("Adding topic:", topic);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return topic;
  } catch (error) {
    console.error("Failed to add topic:", error);
    throw error;
  }
}
