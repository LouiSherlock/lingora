export type Question = { id: string; type: "single_choice" | "fill_blank" | "true_false"; level: string; knowledgePoints: string[]; stem: string; options: { key: string; text: string }[]; answer: string; explanation: string };
export type Practice = { id: string; title: string; questions: Question[]; createdAt: string };
