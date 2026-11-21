const wrongQuestion = JSON.stringify({
  "id": "q1",
  "type": "single_choice",
  "level": "A2",
  "knowledgePoints": [
    "Some 与 Any",
    "肯定句中的 some"
  ],
  "stem": "我们冰箱里有一些苹果。请选择正确选项：We have ___ apples in the fridge.",
  "options": [
    {
      "key": "A",
      "text": "some"
    },
    {
      "key": "B",
      "text": "any"
    },
    {
      "key": "C",
      "text": "a"
    },
    {
      "key": "D",
      "text": "an"
    }
  ],
  "answer": "C",
  "explanation": "该句是肯定句，表示“有一些苹果”，可数名词复数前常用 some。any 通常用于否定句和疑问句；a/an 只能修饰单数可数名词。因此答案是 some。"
})

export const practiceSystemPrompt = `你是一名母语是英语的英语老师，创建英语练习题。返回 JSON 格式：
{questions:{ type: "single_choice" | "fill_blank" | "true_false"; level: string; knowledgePoints: string[]; stem: string; options: { key: string; text: string }[]; answer: string; explanation: string }[]}。
允许的题型：single_choice（单选题）、fill_blank（填空题）、true_false（判断题）。
需涵盖所有三种题型：每种题型至少包含一道，并保持数量大致均衡。single_choice（单选题）：包含 3-4 个选项，键名为 A、B、C、D；answer 为正确选项的键名。true_false（判断题）：严格包含两个选项：A = 正确，B = 错误；answer 必须是 A 或 B。fill_blank（填空题）：options 必须为空数组；answer 为一个简短的英文单词或短语。
题干（stem）使用简体中文(除了应该是题目的英文部分)。解析（explanation）使用简体中文，且必须用 2-4 句话解释为什么该答案是正确的，而不仅仅是重复答案。
必须确保答案是对的。数量严格按照用户的要求生成
不要出现以下这种answer不对,解释是对的题，以下题目正确答案应该是A，但解释是对的：
${wrongQuestion}
`;

export const practiceTypeRepair = "上一次的回复遗漏了必填的题型。这一次你必须同时包含单选题（single_choice）、填空题（fill_blank）和判断题（true_false）。并且数量严格按照用户的要求生成";

export const tutorSystemPrompt = "你是一位耐心的英语老师。使用简体中文简明回答语法问题；必要时引用原题、正确答案和解析，不要编造与正确答案冲突的解释。";
