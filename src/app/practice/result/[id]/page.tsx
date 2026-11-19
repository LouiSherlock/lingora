"use client";
import { ArrowLeft, ChartNoAxesColumnIncreasing, CircleCheck, RotateCcw } from "lucide-react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import type { Question } from "../../../../lib/practice-data";
import { useLearningStore } from "../../../../stores/learning-store";

const typeLabels: Record<Question["type"], string> = {
  single_choice: "单项选择",
  fill_blank: "填空",
  true_false: "判断",
};

function answerText(question: Question, answer: string) {
  const option = question.options.find((item) => item.key.trim().toLowerCase() === answer.trim().toLowerCase());
  return option ? `${answer.toUpperCase()}. ${option.text}` : answer;
}

export default function PracticeResult() {
  const router = useRouter();
  const result = useLearningStore((state) => state.latestResult);
  const history = useLearningStore((state) => state.history);
  const start = useLearningStore((state) => state.start);
  const levelUp = history.length > 0 && history.length % 5 === 0;

  useEffect(() => {
    if (levelUp) {
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 } });
    }
  }, [levelUp]);

  if (!result) {
    return <VStack gap={4} className="page-container page-container--spacious"><Heading level={1}>暂时没有练习结果</Heading><Text>先完成一组练习，再查看详细解析。</Text><Button label="开始练习" href="/practice/create" variant="primary" /></VStack>;
  }

  const { practice, answers } = result;
  const score = practice.questions.filter((question) => (answers[question.id] ?? "").trim().toLowerCase() === question.answer.trim().toLowerCase()).length;
  const percentage = Math.round(score / practice.questions.length * 100);
  const wrongQuestions = practice.questions.filter((question) => (answers[question.id] ?? "").trim().toLowerCase() !== question.answer.trim().toLowerCase());
  const weakPoints = [...new Set(wrongQuestions.flatMap((question) => question.knowledgePoints))];

  function startReview() {
    const questions = wrongQuestions.length ? wrongQuestions : practice.questions;
    const nextPractice = { ...practice, id: crypto.randomUUID(), title: wrongQuestions.length ? `针对练习 · ${practice.title}` : `巩固练习 · ${practice.title}`, questions };
    start(nextPractice);
    router.push(`/practice/session/${nextPractice.id}`);
  }

  return <VStack gap={6} className="page-container page-container--regular">
    <HStack as="header" hAlign="start"><Button label="返回" icon={<ArrowLeft size={16} />} href="/" variant="ghost" /></HStack>
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card><VStack gap={3} className="result-summary"><Badge label="练习已完成" variant="success" /><Heading level={1}>{percentage}%</Heading><Text>{practice.title} · 答对 {score} / {practice.questions.length} 题</Text>{levelUp && <Text type="label">学习等级提升，继续保持节奏！</Text>}</VStack></Card>
    </motion.div>
    <HStack gap={3} className="result-stats"><Card><HStack gap={3} vAlign="start"><CircleCheck size={24} aria-hidden="true" /><VStack gap={1}><Text type="label">答对</Text><Heading level={3}>{score}</Heading></VStack></HStack></Card><Card><HStack gap={3} vAlign="start"><RotateCcw size={24} aria-hidden="true" /><VStack gap={1}><Text type="label">待复习</Text><Heading level={3}>{wrongQuestions.length}</Heading></VStack></HStack></Card><Card><HStack gap={3} vAlign="start"><ChartNoAxesColumnIncreasing size={24} aria-hidden="true" /><VStack gap={1}><Text type="label">正确率</Text><Heading level={3}>{percentage}%</Heading></VStack></HStack></Card></HStack>
    {weakPoints.length > 0 && <Card><VStack gap={2}><Heading level={3}>优先复习</Heading><Text>{weakPoints.join("、")}</Text><Text type="supporting">先理解下方解析，再开始针对练习。</Text></VStack></Card>}
    <Card><VStack gap={3}><Heading level={3}>下一步</Heading><Text>{wrongQuestions.length ? "错题会组成一组更短的巩固练习。" : "这组题全部答对了，可以再做一组巩固掌握。"}</Text><Button label={wrongQuestions.length ? "根据错题再练一轮" : "再做一组巩固练习"} variant="primary" onClick={startReview} /></VStack></Card>
    <VStack gap={3}><Heading level={2}>逐题解析</Heading>{practice.questions.map((question, index) => { const correct = (answers[question.id] ?? "").trim().toLowerCase() === question.answer.trim().toLowerCase(); return <motion.div key={question.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }}><Card><VStack gap={2}><HStack hAlign="between" wrap="wrap"><Badge label={correct ? "回答正确" : "需要复习"} variant={correct ? "success" : "warning"} /><Text type="supporting">{typeLabels[question.type]} · {question.knowledgePoints.join("、")}</Text></HStack><Text>{question.stem}</Text><Text type="supporting">你的答案：{answers[question.id] ? answerText(question, answers[question.id]) : "未作答"} · 正确答案：{answerText(question, question.answer)}</Text><Text>{question.explanation}</Text></VStack></Card></motion.div>; })}</VStack>
    <HStack gap={3}><Button label="再来一组" href="/practice/create" variant="primary" /><Button label="返回首页" href="/" variant="secondary" /></HStack>
  </VStack>;
}

