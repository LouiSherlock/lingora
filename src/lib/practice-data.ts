export type Question = { id: string; type: "single_choice" | "fill_blank" | "true_false"; level: string; knowledgePoints: string[]; stem: string; options: { key: string; text: string }[]; answer: string; explanation: string };
export type Practice = { id: string; title: string; questions: Question[]; createdAt: string };
export const sampleQuestions: Question[] = [
  { id: "q1", type: "single_choice", level: "A2", knowledgePoints: ["现在完成时"], stem: "She ____ in London for three years.", options: [{key:"A",text:"lives"},{key:"B",text:"has lived"},{key:"C",text:"lived"},{key:"D",text:"is living"}], answer:"B", explanation:"for + 一段时间强调从过去持续到现在，使用现在完成时。" },
  { id: "q2", type: "fill_blank", level: "A2", knowledgePoints: ["现在完成时"], stem: "I ____ (not / finish) my homework yet.", options: [], answer:"haven't finished", explanation:"yet 常用于现在完成时的否定句和疑问句。" },
  { id: "q3", type: "true_false", level: "A2", knowledgePoints: ["现在完成时"], stem: "“I have visited Paris last year.” is grammatically correct.", options: [{key:"true",text:"正确"},{key:"false",text:"错误"}], answer:"false", explanation:"明确的过去时间 last year 应搭配一般过去时：I visited Paris last year。" },
  { id: "q4", type: "single_choice", level: "A2", knowledgePoints: ["现在完成时"], stem: "____ you ever ____ sushi?", options: [{key:"A",text:"Did; eat"},{key:"B",text:"Have; eaten"},{key:"C",text:"Do; eat"},{key:"D",text:"Are; eating"}], answer:"B", explanation:"询问截至目前的经历用现在完成时：Have + 主语 + 过去分词。" },
  { id: "q5", type: "single_choice", level: "A2", knowledgePoints: ["现在完成时"], stem: "Tom has ____ arrived, so we can start.", options: [{key:"A",text:"just"},{key:"B",text:"yet"},{key:"C",text:"ever"},{key:"D",text:"since"}], answer:"A", explanation:"just 表示“刚刚”，常放在 have/has 与过去分词之间。" },
];
export const grammarTopics = [
  { slug: "present-perfect", title: "Present Perfect", chinese: "现在完成时", level: "A2", category: "时态", summary: "连接过去与现在，表达经历、结果或持续状态。", formula: "have / has + past participle", examples: ["I have finished my work.", "She has lived here since 2020.", "Have you ever tried sushi?"], tip: "明确的过去时间（yesterday、last year）通常使用一般过去时。" },
  { slug: "present-simple", title: "Present Simple", chinese: "一般现在时", level: "A1", category: "时态", summary: "表达习惯、事实和普遍真理。", formula: "主语 + 动词原形（第三人称单数加 -s）", examples: ["I drink tea every morning.", "The sun rises in the east."], tip: "第三人称单数主语后，动词通常加 -s 或 -es。" },
  { slug: "past-simple", title: "Past Simple", chinese: "一般过去时", level: "A2", category: "时态", summary: "描述过去某个已完成的动作或状态。", formula: "主语 + 动词过去式", examples: ["We visited the museum yesterday.", "She went home at six."], tip: "不规则动词需要记忆过去式形式。" },
  { slug: "articles", title: "Articles", chinese: "冠词", level: "A1", category: "名词", summary: "a/an 表示泛指单数，the 表示特指。", formula: "a + 辅音音素；an + 元音音素；the + 特指名词", examples: ["I saw a bird. The bird was blue.", "She is an engineer."], tip: "判断 a/an 看发音，不只看拼写。" },
];
