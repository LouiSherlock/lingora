"use client";
import { ArrowLeft } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { getClientAISettings } from "../../../lib/client-ai";
import { useLearningStore } from "../../../stores/learning-store";
import presets from "../../../data/preset.json";
import { PracticeGenerating } from "../../../components/PracticeGenerating";

type CreatePracticeClientProps = { initialTopic: string; initialLevel: string };

export default function CreatePracticeClient({ initialTopic, initialLevel }: CreatePracticeClientProps) {
  const router = useRouter();
  const start = useLearningStore((state) => state.start);
  const ai = useLearningStore((state) => state.settings);
  const [topic, setTopic] = useState("");
  const [isManualTopic, setIsManualTopic] = useState(false);
  const [custom, setCustom] = useState("");
  const [level, setLevel] = useState(initialLevel);
  const [difficulty, setDifficulty] = useState("Medium");
  const [count, setCount] = useState("5");
  const [kind, setKind] = useState("Grammar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestController = useRef<AbortController | null>(null);
  useEffect(() => () => requestController.current?.abort(), []);
  const levelPreset = presets.levels.find((item) => item.id === level);
  const topicGroups = kind === "Grammar" ? levelPreset?.grammar : levelPreset?.vocabulary;
  const topicOptions = (topicGroups ?? []).flatMap((group) => [
    { type: "section" as const, title: group.name, options: group.topics.map((item) => ({ value: item.name, label: item.name })) },
  ]);

  async function generate() {
    const controller = new AbortController();
    requestController.current = controller;
    let navigationStarted = false;
    setLoading(true);
    setError("");
    try {
      const aiConfig = await getClientAISettings(ai);
      if (!aiConfig.baseUrl || !aiConfig.apiKey || !aiConfig.model) throw new Error("请先在设置中填写兼容接口，获取并选择模型后确认配置。");
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, level, difficulty, count: Number(count), kind, custom, ai: aiConfig }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      start(data.practice);
      navigationStarted = true;
      router.push(`/practice/session/${data.practice.id}`);
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : "生成失败，请稍后重试。");
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        if (!navigationStarted) setLoading(false);
      }
    }
  }

  return <VStack gap={6} className="page-container page-container--regular">
    <HStack as="header" hAlign="start"><Button label="返回" icon={<ArrowLeft size={16} />} href="/" variant="ghost" onClick={() => requestController.current?.abort()} /></HStack>
    {loading ? <PracticeGenerating /> : <>
    <VStack gap={1}><Text type="label">个性化练习</Text><Heading level={1}>创建 AI 练习</Heading><Text>设置练习目标，生成适合你的英语题目。</Text></VStack>
    {error && <Banner status="warning" title="练习生成失败" description={error} isDismissable onDismiss={() => setError("")} endContent={<Button label="检查 AI 设置" href="/settings" variant="secondary" />} />}
    <Card><VStack gap={5}>
      <VStack gap={2}><Text type="label">学习类型</Text><HStack gap={2} wrap="wrap">{([ ["Grammar", "语法"], ["Vocabulary", "词汇"] ] as const).map(([value, label]) => <Button key={value} label={label} variant={kind === value ? "primary" : "secondary"} onClick={() => setKind(value)} />)}</HStack></VStack>
      <VStack gap={2}><Text type="label">英语等级</Text><HStack wrap="wrap" gap={2}>{["A1", "A2", "B1", "B2", "C1", "C2"].map((value) => <Button key={value} label={value} variant={level === value ? "primary" : "secondary"} onClick={() => setLevel(value)} />)}</HStack></VStack>
      <VStack gap={2}>
        {isManualTopic
          ? <TextInput label="知识点 / 主题" value={topic} onChange={setTopic} placeholder="例如：现在完成时、旅行词汇" />
          : <Selector label="选择知识点 / 主题" options={topicOptions} value={topicOptions.some((option) => option.type === "section" && option.options.some((item) => item.value === topic)) ? topic : ""} onChange={setTopic} hasSearch placeholder="按英语等级选择主题" />}
        <HStack hAlign="end" paddingBlockStart={1}>
          <Switch label="手动输入主题" value={isManualTopic} onChange={setIsManualTopic} />
        </HStack>
      </VStack>
      <VStack gap={2}><Text type="label">难度</Text><HStack gap={2} wrap="wrap">{([ ["Easy", "简单"], ["Medium", "普通"], ["Hard", "困难"] ] as const).map(([value, label]) => <Button key={value} label={label} variant={difficulty === value ? "primary" : "secondary"} onClick={() => setDifficulty(value)} />)}</HStack></VStack>
      <VStack gap={2}><Text type="label">题目数量</Text><HStack gap={2} wrap="wrap">{["5", "10", "15", "20"].map((value) => <Button key={value} label={`${value} 题`} variant={count === value ? "primary" : "secondary"} onClick={() => setCount(value)} />)}</HStack></VStack>
      <TextInput label="自定义要求" value={custom} onChange={setCustom} placeholder="重点考察容易混淆的语法用法" />
      <Text type="supporting">支持单选、填空和判断；题干为英文，解析为中文。</Text>
      <Button label={loading ? "正在生成…" : "生成练习方案"} variant="primary" isDisabled={loading || !topic.trim()} onClick={generate} />
    </VStack></Card>
    </>}
  </VStack>;
}



