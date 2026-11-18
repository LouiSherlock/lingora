"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useLearningStore } from "../../../../stores/learning-store";

function SessionContent() {
  const params = useParams<{id:string}>(); const router = useRouter();
  const active = useLearningStore((s)=>s.active); const answers=useLearningStore((s)=>s.answers); const current=useLearningStore((s)=>s.current); const uncertain=useLearningStore((s)=>s.uncertain); const answer=useLearningStore((s)=>s.answer); const go=useLearningStore((s)=>s.go); const toggle=useLearningStore((s)=>s.toggleUncertain); const finish=useLearningStore((s)=>s.finish);
  const [confirmExit,setConfirmExit]=useState(false);
  const [followUp,setFollowUp]=useState(""); const [assistantReply,setAssistantReply]=useState(""); const [asking,setAsking]=useState(false);
  const ai=useLearningStore((s)=>s.settings);
  useEffect(()=>{ if(!active) router.replace("/practice/create"); },[active,router]);
  if(!active || active.id!==params.id) return <VStack className="min-h-screen items-center justify-center"><Text>正在恢复练习…</Text></VStack>;
  const practice = active;
  const q=active.questions[current]; const answered=Object.keys(answers).length;
  function complete(){ finish(); confetti({particleCount:120,spread:75,origin:{y:.65}}); router.push(`/practice/result/${practice.id}`); }
  function choose(key:string){ answer(q.id,key); if(key.trim().toLowerCase()===q.answer.trim().toLowerCase()) confetti({particleCount:28,spread:42,startVelocity:24,origin:{y:.72}}); }
  async function askAssistant(){if(!followUp.trim())return;setAsking(true);setAssistantReply("");try{const response=await fetch("/api/explain",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q.stem,answer:q.answer,followUp,ai})});const data=await response.json();if(!response.ok)throw new Error(data.error);setAssistantReply(data.reply);setFollowUp("");}catch(error){setAssistantReply(error instanceof Error?error.message:"暂时无法获取回答。");}finally{setAsking(false);}}
  return <VStack gap={6} className="mx-auto w-full max-w-3xl px-5 py-6">
    <HStack as="header" hAlign="between" vAlign="center"><Heading level={2}>EnglishFlow</Heading><Button label="退出练习" variant="ghost" onClick={()=>setConfirmExit(true)}/></HStack>
    {confirmExit && <Card><VStack gap={3}><Text>答题进度已自动保存，确定退出吗？</Text><HStack gap={2}><Button label="继续练习" onClick={()=>setConfirmExit(false)} variant="secondary"/><Button label="保存并退出" href="/" variant="primary"/></HStack></VStack></Card>}
    <VStack gap={2}><HStack hAlign="between"><Text type="label">{active.title}</Text><Text type="supporting">{current+1} / {active.questions.length}</Text></HStack><progress className="w-full accent-current" value={answered} max={active.questions.length}/></VStack>
    <motion.div key={q.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.2}}>
      <Card><VStack gap={5}><HStack hAlign="between"><Text type="label">QUESTION {String(current+1).padStart(2,"0")}</Text><Button label={uncertain.includes(q.id)?"已标记不确定":"标记不确定"} variant="ghost" onClick={()=>toggle(q.id)}/></HStack><Heading level={2}>{q.stem}</Heading>
        {q.type==="fill_blank" ? <TextInput label="你的答案" value={answers[q.id]??""} onChange={(value)=>answer(q.id,value)} placeholder="输入答案"/> : <VStack gap={2}>{q.options.map((option,index)=>{const key=option.key||String.fromCharCode(65+index);return <Button key={`${q.id}-${index}`} label={`${key.toUpperCase()}.  ${option.text}`} variant={answers[q.id]===key?"primary":"secondary"} onClick={()=>choose(key)}/>})}</VStack>}
        <Text type="supporting">知识点：{q.knowledgePoints.join("、")}</Text></VStack></Card>
    </motion.div>
    <Card><VStack gap={3}><Heading level={3}>AI 助教</Heading><TextInput label="针对这道题继续提问" value={followUp} onChange={setFollowUp} placeholder="例如：为什么这里要用现在完成时？"/><Button label={asking?"正在思考…":"提问"} variant="secondary" isDisabled={asking||!followUp.trim()} onClick={askAssistant}/>{assistantReply&&<Text>{assistantReply}</Text>}</VStack></Card>
    <HStack hAlign="between" vAlign="center"><Button label="上一题" variant="secondary" isDisabled={current===0} onClick={()=>go(current-1)}/><HStack gap={1}>{active.questions.map((item,i)=><Button key={item.id} label={String(i+1)} variant={i===current?"primary":answers[item.id]?"secondary":"ghost"} onClick={()=>go(i)}/>)}</HStack>{current<active.questions.length-1?<Button label="下一题" variant="primary" onClick={()=>go(current+1)}/>:<Button label="提交练习" variant="primary" onClick={complete}/>}</HStack>
    <Text type="supporting">已回答 {answered} 题 · 答案会自动暂存</Text>
  </VStack>;
}

export default function PracticeSession() { return <Suspense fallback={<VStack className="min-h-screen items-center justify-center"><Text>正在加载练习…</Text></VStack>}><SessionContent /></Suspense>; }
