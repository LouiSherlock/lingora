"use client";
import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { useLearningStore } from "../../stores/learning-store";

export default function Settings() {
  const saved = useLearningStore((state) => state.settings);
  const update = useLearningStore((state) => state.updateSettings);
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl === "https://api.openai.com/v1" ? "https://opencode.ai/inference/openai/v1" : saved.baseUrl);
  const [apiKey, setApiKey] = useState(() => saved.apiKey || (typeof window === "undefined" ? "" : sessionStorage.getItem("englishflow-api-key") ?? ""));
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(saved.model);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function loadModels() {
    setBusy(true); setMessage(""); setConfirmed(false);
    try {
      const response = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl, apiKey }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "获取模型失败。");
      setModels(data.models);
      setSelectedModel(data.models.includes(saved.model) ? saved.model : data.models[0] ?? "");
      setMessage(data.models.length ? `获取到 ${data.models.length} 个模型，请选择并确认。` : "接口连接成功，但没有返回可选模型。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "连接失败。"); }
    finally { setBusy(false); }
  }

  function confirm() {
    if (!baseUrl || !apiKey || !selectedModel) { setMessage("请填写接口地址和 API Key，并选择模型。"); return; }
    update({ baseUrl: baseUrl.replace(/\/$/, ""), apiKey, model: selectedModel });
    sessionStorage.setItem("englishflow-api-key", apiKey);
    setConfirmed(true); setMessage("配置已确认，可以开始生成练习。");
  }

  return <VStack gap={5} className="mx-auto max-w-3xl px-5 py-6">
    <HStack as="header" hAlign="between"><Heading level={2}>EnglishFlow · 设置</Heading><Button label="首页" href="/" variant="ghost" /></HStack>
    <VStack gap={1}><Heading level={1}>连接 AI 模型</Heading><Text>先填写 OpenAI 兼容接口，再获取并选择该接口提供的模型。</Text></VStack>
    <Card><VStack gap={4}>
      <TextInput label="兼容接口 Base URL" value={baseUrl} onChange={(value) => { setBaseUrl(value); setConfirmed(false); }} placeholder="https://api.example.com/v1" />
      <TextInput label="API Key" type="password" value={apiKey} onChange={(value) => { setApiKey(value); setConfirmed(false); }} placeholder="输入服务商提供的 API Key" />
      <Button label={busy ? "正在获取模型…" : "获取可选模型"} variant="secondary" isDisabled={busy || !baseUrl || !apiKey} onClick={loadModels} />
      {models.length > 0 && <VStack gap={2}><Text type="label">选择模型</Text><DropdownMenu button={{ label: selectedModel || "请选择模型", variant: "secondary" }} items={models.map((model) => ({ id: model, label: model, onClick: () => { setSelectedModel(model); setConfirmed(false); } }))} /></VStack>}
      {message && <Text type={confirmed ? "label" : "supporting"}>{message}</Text>}
      <Button label="确认并保存" variant="primary" isDisabled={!selectedModel || confirmed} onClick={confirm} />
      <Text type="supporting">Base URL 和模型选择保存在当前浏览器。API Key 只保存在当前标签页会话内存中，并会随模型请求发送到本应用服务端；不会写入 localStorage。关闭或刷新页面后需要重新填写 API Key。</Text>
    </VStack></Card>
  </VStack>;
}

