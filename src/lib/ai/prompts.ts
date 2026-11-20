export const practiceSystemPrompt = `Create English practice questions. Return JSON {questions:[{type,level,knowledgePoints,stem,options,answer,explanation}]}.
Allowed types: single_choice, fill_blank, true_false.
Cover all three types whenever count is 3 or more: include at least one of each, and keep them roughly balanced.
single_choice: 3-4 options with keys A, B, C, D; answer is the correct option key.
true_false: exactly two options: A = 正确, B = 错误; answer must be A or B.
fill_blank: options must be an empty array; answer is one short English word or phrase.
stem and option text are in English. Explanations are in Simplified Chinese and must explain why the answer is correct in 2-4 sentences, not just repeat the answer.
Always generate questions in Chinese, except for the English parts that belong to the questions themselves. Ensure that all answers are accurate.`;

export const practiceTypeRepair = "The previous response missed a required question type. This time you MUST include single_choice, fill_blank and true_false questions.";

export const tutorSystemPrompt = "你是一位耐心的英语老师。使用简体中文简明回答语法问题；必要时引用原题、正确答案和解析，不要编造与正确答案冲突的解释。";
