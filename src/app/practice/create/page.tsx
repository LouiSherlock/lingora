import CreatePracticeClient from "./CreatePracticeClient";

export const instant = false;

export default async function CreatePractice({ searchParams }: { searchParams: Promise<{ topic?: string | string[] }> }) {
  const { topic } = await searchParams;
  const initialTopic = typeof topic === "string" ? topic.slice(0, 120) : "现在完成时";

  return <CreatePracticeClient initialTopic={initialTopic} />;
}
