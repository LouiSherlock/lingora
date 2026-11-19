"use client";
import { ArrowLeft } from "lucide-react";
import { Suspense, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { useLearningStore } from "../../../../stores/learning-store";
import { getClientAISettings, type ClientAISettings } from "../../../../lib/client-ai";
import type { Question } from "../../../../lib/practice-data";

const typeLabels: Record<Question["type"], string> = {
  single_choice: "单项选择",
  fill_blank: "填空",
  true_false: "判断",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function answerLabel(question: Question) {
  const option = question.options.find((item) => normalize(item.key) === normalize(question.answer));
  return option ? `${question.answer.toUpperCase()}. ${option.text}` : question.answer;
}

const subscribeToMount = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

function subscribeToHydration(onStoreChange: () => void) {
  return useLearningStore.persist.onFinishHydration(onStoreChange);
}

const getHydrated = () => useLearningStore.persist.hasHydrated();
const getServerHydrated = () => false;

function Assistant({ question, ai }: { question: Question; ai: ClientAISettings }) {
  const [followUp, setFollowUp] = useState("");
  const [reply, setReply] = useState("");
  const [asking, setAsking] = useState(false);
  async function ask() {
    if (!followUp.trim()) return;
    setAsking(true);
    setReply("");
    try {
      const response = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question.stem, answer: question.answer, followUp, ai: await getClientAISettings(ai) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReply(data.reply);
      setFollowUp("");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "暂时无法获取回答。");
    } finally {
      setAsking(false);
    }
  }
  return <Card><VStack gap={3}><Heading level={3}>AI 助教</Heading><TextInput label="针对这道题继续提问" value={followUp} onChange={setFollowUp} placeholder="例如：为什么这里要用现在完成时？"/><Button label={asking ? "正在思考…" : "提问"} variant="secondary" isDisabled={asking || !followUp.trim()} onClick={ask}/>{reply && <Markdown density="compact">{reply}</Markdown>}</VStack></Card>;
}

function SessionContent() {
  const params = useParams<{id:string}>(); const router = useRouter();
  const active = useLearningStore((s)=>s.active); const answers=useLearningStore((s)=>s.answers); const current=useLearningStore((s)=>s.current); const submittedIds=useLearningStore((s)=>s.submitted); const completed=useLearningStore((s)=>s.completed); const answer=useLearningStore((s)=>s.answer); const go=useLearningStore((s)=>s.go); const submit=useLearningStore((s)=>s.submit); const advance=useLearningStore((s)=>s.advance); const discard=useLearningStore((s)=>s.discard); const finish=useLearningStore((s)=>s.finish);
  const [confirmExit,setConfirmExit]=useState(false);
  const [leaving,setLeaving]=useState(false);
  const mounted=useSyncExternalStore(subscribeToMount,getMounted,getServerMounted);
  const hydrated=useSyncExternalStore(subscribeToHydration,getHydrated,getServerHydrated);
  const ai=useLearningStore((s)=>s.settings);
  if(!mounted || !hydrated || leaving) return <VStack className="centered-content"><Text>{leaving ? "正在生成答题结果…" : "正在恢复练习…"}</Text></VStack>;
  if(!active || active.id!==params.id) return <VStack className="centered-content"><Card><VStack gap={3}><Heading level={2}>找不到这次练习</Heading><Text>练习可能已经结束，或链接已失效。</Text><Button label="重新开始练习" href="/practice/create" variant="primary"/></VStack></Card></VStack>;
  const practice = active;
  const q=active.questions[current];
  const submitted=submittedIds.includes(q.id);
  const selectedAnswer=answers[q.id]??"";
  const isCorrect=normalize(selectedAnswer)===normalize(q.answer);
  const canSubmit=selectedAnswer.trim().length>0;
  function submitAnswer(){ if(!canSubmit || submitted) return; submit(q.id); if(isCorrect) confetti({particleCount:28,spread:42,startVelocity:24,origin:{y:.72}}); }
  function complete(){ if(!submitted) return; setLeaving(true); advance(); finish(); confetti({particleCount:120,spread:75,origin:{y:.65}}); router.push(`/practice/result/${practice.id}`); }
  function skipQuestion(){
    if (current < practice.questions.length - 1) {
      advance();
      return;
    }
    setLeaving(true);
    finish();
    router.push(`/practice/result/${practice.id}`);
  }
  return <VStack gap={6} className="page-container page-container--compact">
    <HStack as="header" hAlign="start"><Button label="返回" icon={<ArrowLeft size={16} />} href="/" variant="ghost" /></HStack>
    <AlertDialog isOpen={confirmExit} onOpenChange={setConfirmExit} title="退出练习？" description="本次答题进度和已填写的答案都不会保存，退出后需要重新开始。" cancelLabel="继续练习" actionLabel="放弃并退出" onAction={()=>{setLeaving(true); discard(); router.push("/");}}/>
    <VStack gap={2}><HStack hAlign="between"><Text type="label">{active.title}</Text><Text type="supporting">{current+1} / {active.questions.length}</Text></HStack><ProgressBar label="练习进度" isLabelHidden value={completed.length} max={active.questions.length} hasValueLabel formatValueLabel={(_, maximum) => `已完成 ${completed.length} / ${maximum}`} /></VStack>
    <motion.div key={q.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.2}}>
      <Card><VStack gap={5}>
        <HStack hAlign="between" wrap="wrap"><HStack gap={2} vAlign="center"><Text type="supporting">{typeLabels[q.type]}</Text></HStack></HStack>
        <Heading level={2}>{q.stem}</Heading>
        {q.type==="fill_blank"
          ? <TextInput label="你的答案" value={selectedAnswer} onChange={(value)=>answer(q.id,value)} onEnter={submitAnswer} placeholder="输入答案后提交" isReadOnly={submitted}/>
          : <VStack gap={2}>{q.options.map((option,index)=>{const key=option.key||String.fromCharCode(65+index);const selected=normalize(selectedAnswer)===normalize(key);const right=submitted&&normalize(key)===normalize(q.answer);const wrong=submitted&&selected&&!right;const variant=submitted?(right?"green":wrong?"red":"default"):selected?"yellow":"default";const content=<HStack gap={3} hAlign="start" vAlign="center" width="100%"><Text type="label">{key.toUpperCase()}</Text><Text>{option.text}</Text></HStack>;return submitted?<Card key={`${q.id}-${index}`} padding={3} variant={variant}>{content}</Card>:<ClickableCard key={`${q.id}-${index}`} label={`${key.toUpperCase()}. ${option.text}`} padding={3} variant={variant} onClick={()=>answer(q.id,key)}>{content}</ClickableCard>})}</VStack>}
        {!submitted && <Button label="提交答案" variant="primary" isDisabled={!canSubmit} onClick={submitAnswer}/>}
        {submitted && (isCorrect
          ? <Banner status="success" title="回答正确" description={q.explanation || "暂无解析。"}/>
          : <Banner status="error" title={<Text as="span" color="inherit" className="feedback-error-text">{`回答错误 · 正确答案：${answerLabel(q)}`}</Text>} description={<Text as="span" color="inherit" className="feedback-error-text">{q.explanation || "暂无解析。"}</Text>}/>)}
        <Text type="supporting">知识点：{q.knowledgePoints.join("、")}</Text>
      </VStack></Card>
    </motion.div>
    <Assistant key={`assistant-${q.id}`} question={q} ai={ai}/>
    <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
      <Button label="上一题" variant="secondary" isDisabled={current===0} onClick={()=>go(current-1)}/>
      {submitted ? (current<active.questions.length-1
        ? <Button label="下一题" variant="primary" onClick={advance}/>
        : <Button label="完成练习" variant="primary" onClick={complete}/>) : <HStack gap={2}>
          <Button label="跳过" variant="secondary" onClick={skipQuestion}/>
         
        </HStack>}
    </HStack>
  
  </VStack>;
}

export default function PracticeSession() { return <Suspense fallback={<VStack className="centered-content"><Text>正在加载练习…</Text></VStack>}><SessionContent /></Suspense>; }
