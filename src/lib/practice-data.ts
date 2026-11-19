export type Question = { id: string; type: "single_choice" | "fill_blank" | "true_false"; level: string; knowledgePoints: string[]; stem: string; options: { key: string; text: string }[]; answer: string; explanation: string };
export type Practice = { id: string; title: string; questions: Question[]; createdAt: string; aiSessionId?: string };
export const grammarTopics = [
  { slug: "present-perfect", title: "Present Perfect", chinese: "现在完成时", level: "A2", category: "时态", summary: "连接过去与现在，表达经历、结果或持续状态。", formula: "have / has + past participle", examples: ["I have finished my work.", "She has lived here since 2020.", "Have you ever tried sushi?"], tip: "明确的过去时间（yesterday、last year）通常使用一般过去时。" },
  { slug: "present-simple", title: "Present Simple", chinese: "一般现在时", level: "A1", category: "时态", summary: "表达习惯、事实和普遍真理。", formula: "主语 + 动词原形（第三人称单数加 -s）", examples: ["I drink tea every morning.", "The sun rises in the east."], tip: "第三人称单数主语后，动词通常加 -s 或 -es。" },
  { slug: "past-simple", title: "Past Simple", chinese: "一般过去时", level: "A2", category: "时态", summary: "描述过去某个已完成的动作或状态。", formula: "主语 + 动词过去式", examples: ["We visited the museum yesterday.", "She went home at six."], tip: "不规则动词需要记忆过去式形式。" },
  { slug: "articles", title: "Articles", chinese: "冠词", level: "A1", category: "名词", summary: "a/an 表示泛指单数，the 表示特指。", formula: "a + 辅音音素；an + 元音音素；the + 特指名词", examples: ["I saw a bird. The bird was blue.", "She is an engineer."], tip: "判断 a/an 看发音，不只看拼写。" },
];
