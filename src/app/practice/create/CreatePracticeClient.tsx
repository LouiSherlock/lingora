"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { getClientAISettings } from "../../../lib/client-ai";
import { useLearningStore } from "../../../stores/learning-store";

type CreatePracticeClientProps = { initialTopic: string };

export default function CreatePracticeClient({ initialTopic }: CreatePracticeClientProps) {
  const router = useRouter();
  const start = useLearningStore((state) => state.start);
  const ai = useLearningStore((state) => state.settings);
  const [topic, setTopic] = useState(initialTopic);
  const [custom, setCustom] = useState("");
  const [level, setLevel] = useState("A2");
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState("5");
  const [kind, setKind] = useState("Grammar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const aiConfig = await getClientAISettings(ai);
      if (!aiConfig.baseUrl || !aiConfig.credential || !aiConfig.model) throw new Error("请先在设置中填写兼容接口，获取并选择模型后确认配置。");
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, level, difficulty, count: Number(count), kind, custom, ai: aiConfig }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      start(data.practice);
      router.push(`/practice/session/${data.practice.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return <VStack gap={6} className="mx-auto w-full max-w-5xl px-5 py-8">
    <HStack as="header" hAlign="between" vAlign="center" wrap="wrap" gap={3}><Heading level={2}>EnglishFlow</Heading><HStack gap={2} wrap="wrap"><Button label="首页" href="/" variant="ghost" /><Button label="语法知识库" href="/grammar" variant="ghost" /><Button label="设置" href="/settings" variant="ghost" /></HStack></HStack>
    <VStack gap={1}><Text type="label">PERSONALIZED PRACTICE</Text><Heading level={1}>Create AI Practice</Heading><Text>设置练习目标，生成适合你的英语题目。</Text></VStack>
    {error && <Banner status="error" title="无法生成练习" description={error} endContent={<Button label="检查 AI 设置" href="/settings" variant="secondary" />} />}
    <Card><VStack gap={5}>
      <VStack gap={2}><Text type="label">学习类型</Text><HStack gap={2} wrap="wrap">{["Grammar", "Vocabulary"].map((value) => <Button key={value} label={value} variant={kind === value ? "primary" : "secondary"} onClick={() => setKind(value)} />)}</HStack></VStack>
      <VStack gap={2}><Text type="label">英语等级</Text><HStack wrap="wrap" gap={2}>{["A1", "A2", "B1", "B2", "C1", "C2"].map((value) => <Button key={value} label={value} variant={level === value ? "primary" : "secondary"} onClick={() => setLevel(value)} />)}</HStack></VStack>
      <TextInput label="知识点 / 主题" value={topic} onChange={setTopic} placeholder="例如：现在完成时、旅行词汇" />
      <VStack gap={2}><Text type="label">难度</Text><HStack gap={2} wrap="wrap">{([ ["Easy", "简单"], ["Medium", "普通"], ["Hard", "困难"] ] as const).map(([value, label]) => <Button key={value} label={label} variant={difficulty === value ? "primary" : "secondary"} onClick={() => setDifficulty(value)} />)}</HStack></VStack>
      <VStack gap={2}><Text type="label">题目数量</Text><HStack gap={2} wrap="wrap">{["5", "10", "15", "20"].map((value) => <Button key={value} label={`${value} 题`} variant={count === value ? "primary" : "secondary"} onClick={() => setCount(value)} />)}</HStack></VStack>
      <TextInput label="自定义要求" value={custom} onChange={setCustom} placeholder="重点考察容易混淆的语法用法" />
      <Text type="supporting">支持单选、填空和判断；题干为英文，解析为中文。</Text>
      <Button label={loading ? "正在生成…" : "生成练习方案"} variant="primary" isDisabled={loading || !topic.trim()} onClick={generate} />
    </VStack></Card>
  </VStack>;
}

