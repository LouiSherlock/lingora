import CreatePracticeClient from "./CreatePracticeClient";

export const instant = false;

export default async function CreatePractice({ searchParams }: { searchParams: Promise<{ topic?: string | string[]; level?: string | string[] }> }) {
  const { topic, level } = await searchParams;
  const initialTopic = typeof topic === "string" ? topic.slice(0, 120) : "现在完成时";
  const initialLevel = typeof level === "string" && /^[A-C][1-2]$/.test(level) ? level : "A2";

  return <CreatePracticeClient initialTopic={initialTopic} initialLevel={initialLevel} />;
}
