"use client";
import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useRouter } from "next/navigation";
import { useLearningStore } from "../../../stores/learning-store";
import { sampleQuestions } from "../../../lib/practice-data";

export default function CreatePractice() {
  const router = useRouter(); const start = useLearningStore((s) => s.start);
  const [topic, setTopic] = useState("现在完成时"); const [custom, setCustom] = useState(""); const [level, setLevel] = useState("A2"); const [difficulty, setDifficulty] = useState("Medium"); const [count, setCount] = useState("5"); const [kind, setKind] = useState("Grammar"); const [loading, setLoading] = useState(false);
  async function generate() { setLoading(true); try { const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, level, difficulty, count: Number(count), kind, custom }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); start(data.practice); router.push(`/practice/session/${data.practice.id}`); } catch (e) { alert(e instanceof Error ? e.message : "生成失败"); } finally { setLoading(false); } }
  return <VStack gap={6} className="mx-auto w-full max-w-4xl px-5 py-6">
    <HStack as="header" hAlign="between" vAlign="center"><Heading level={2}>EnglishFlow</Heading><HStack gap={2}><Button label="首页" href="/" variant="ghost"/><Button label="语法知识库" href="/grammar" variant="ghost"/><Button label="设置" href="/settings" variant="ghost"/></HStack></HStack>
    <VStack gap={1}><Text type="label">PERSONALIZED PRACTICE</Text><Heading level={1}>Create AI Practice</Heading><Text>设置练习目标，生成适合你的英语题目。</Text></VStack>
    <Card><VStack gap={5}>
      <fieldset><legend className="mb-2 font-medium">学习类型</legend><HStack gap={2}>{["Grammar","Vocabulary"].map(x=><Button key={x} label={x} variant={kind===x?"primary":"secondary"} onClick={()=>setKind(x)}/>)}</HStack></fieldset>
      <fieldset><legend className="mb-2 font-medium">英语等级</legend><HStack wrap="wrap" gap={2}>{["A1","A2","B1","B2","C1","C2"].map(x=><Button key={x} label={x} variant={level===x?"primary":"secondary"} onClick={()=>setLevel(x)}/>)}</HStack></fieldset>
      <TextInput label="知识点 / 主题" value={topic} onChange={setTopic} placeholder="例如：现在完成时、旅行词汇" />
      <fieldset><legend className="mb-2 font-medium">难度</legend><HStack gap={2}>{["Easy","Medium","Hard"].map(x=><Button key={x} label={{Easy:"简单",Medium:"普通",Hard:"困难"}[x]} variant={difficulty===x?"primary":"secondary"} onClick={()=>setDifficulty(x)}/>)}</HStack></fieldset>
      <fieldset><legend className="mb-2 font-medium">题目数量</legend><HStack gap={2}>{["5","10","15","20"].map(x=><Button key={x} label={`${x} 题`} variant={count===x?"primary":"secondary"} onClick={()=>setCount(x)}/>)}</HStack></fieldset>
      <TextInput label="自定义要求" value={custom} onChange={setCustom} placeholder="重点考察容易混淆的语法用法" />
      <Text type="supporting">支持单选、填空和判断；题干为英文，解析为中文。</Text>
      <Button label={loading?"正在生成…":"使用此配置生成练习方案"} variant="primary" isDisabled={loading} onClick={generate}/>
    </VStack></Card>
    <Text type="supporting">AI 尚未配置时会使用内置示例题，设置服务端 AI_API_KEY 后启用模型生成。</Text>
  </VStack>;
}
