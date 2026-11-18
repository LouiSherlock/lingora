"use client";
import { useEffect } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useLearningStore } from "../../../../stores/learning-store";

export default function PracticeResult(){ const result=useLearningStore((s)=>s.latestResult); const history=useLearningStore((s)=>s.history); const start=useLearningStore((s)=>s.start);
  useEffect(()=>{ if(result) confetti({particleCount:100,spread:68,origin:{y:.68}}); },[result]);
  if(!result) return <VStack gap={4} className="mx-auto max-w-3xl px-5 py-10"><Heading level={1}>暂时没有练习结果</Heading><Button label="开始练习" href="/practice/create" variant="primary"/></VStack>;
  const {practice,answers}=result; const score=practice.questions.filter(q=>(answers[q.id]??"").trim().toLowerCase()===q.answer.trim().toLowerCase()).length; const pct=Math.round(score/practice.questions.length*100); const weak=[...new Set(practice.questions.filter(q=>(answers[q.id]??"").trim().toLowerCase()!==q.answer.trim().toLowerCase()).flatMap(q=>q.knowledgePoints))]; const levelUp=history.length>0&&history.length%5===0;
  if(levelUp) confetti({particleCount:160,spread:100,origin:{y:.55},colors:["#f6c453","#f28b50","#6c9ad4"]});
  return <VStack gap={6} className="mx-auto w-full max-w-4xl px-5 py-8"><HStack as="header" hAlign="between"><Heading level={2}>EnglishFlow</Heading><Button label="首页" href="/" variant="ghost"/></HStack>
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}><Card><VStack gap={3} className="items-center py-5"><Text type="label">PRACTICE COMPLETE</Text><Heading level={1}>{pct}%</Heading><Text>{practice.title} · 答对 {score} / {practice.questions.length} 题</Text>{levelUp&&<Text type="label">🎉 学习等级提升！持续练习，继续进步</Text>}</VStack></Card></motion.div>
    <HStack wrap="wrap" gap={3}><Card><VStack gap={1}><Text type="label">答对</Text><Heading level={3}>{score}</Heading></VStack></Card><Card><VStack gap={1}><Text type="label">需复习</Text><Heading level={3}>{practice.questions.length-score}</Heading></VStack></Card><Card><VStack gap={1}><Text type="label">正确率</Text><Heading level={3}>{pct}%</Heading></VStack></Card></HStack>
    <VStack gap={3}><Heading level={2}>逐题解析</Heading>{practice.questions.map((q,i)=>{const correct=(answers[q.id]??"").trim().toLowerCase()===q.answer.trim().toLowerCase();return <motion.div key={q.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.05}}><Card><VStack gap={2}><HStack hAlign="between"><Text type="label">{i+1}. {correct?"回答正确":"需要复习"}</Text><Text type="supporting">{q.knowledgePoints.join("、")}</Text></HStack><Text>{q.stem}</Text><Text type="supporting">你的答案：{answers[q.id]||"未作答"} · 正确答案：{q.answer}</Text><Text>{q.explanation}</Text></VStack></Card></motion.div>})}</VStack>
    {weak.length>0&&<Card><VStack gap={2}><Heading level={3}>薄弱知识点</Heading><Text>{weak.join("、")}</Text><Text>建议先复习这些知识点，再进行针对性练习。</Text></VStack></Card>}
    <Card><VStack gap={3}><Heading level={3}>AI 学习建议</Heading><Text>{weak.length?`本轮在${weak.join("、")}上需要更多练习。先回顾解析中的规则，再用新题巩固。`:`表现很棒！可以尝试提高难度，或换一个知识点保持学习节奏。`}</Text><Button label="根据错题再练一轮" variant="primary" onClick={()=>{start({...practice,id:crypto.randomUUID(),title:`针对练习 · ${practice.title}`,questions:practice.questions.filter(q=>(answers[q.id]??"").trim().toLowerCase()!==q.answer.trim().toLowerCase())||practice.questions}); location.href="/practice/session/retry"}}/></VStack></Card>
    <HStack gap={3}><Button label="再来一组" href="/practice/create" variant="primary"/><Button label="查看错题本" href="/mistakes" variant="secondary"/></HStack>
  </VStack>;
}
