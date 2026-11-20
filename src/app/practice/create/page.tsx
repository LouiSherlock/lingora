import CreatePracticeClient from "@/app/practice/create/CreatePracticeClient.tsx";

export const instant = false;

export default async function CreatePractice({ searchParams }: { searchParams: Promise<{ level?: string | string[] }> }) {
  const { level } = await searchParams;
  const initialLevel = typeof level === "string" && /^[A-C][1-2]$/.test(level) ? level : "A2";

  return <CreatePracticeClient initialLevel={initialLevel} />;
}
