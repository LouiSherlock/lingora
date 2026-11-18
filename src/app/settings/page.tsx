"use client";

import { useState } from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { encryptAPIKey, getClientAPIKey, hasSessionAPIKey, saveClientAPIKey } from "../../lib/client-ai";
import { useLearningStore } from "../../stores/learning-store";

export default function Settings() {
  const saved = useLearningStore((state) => state.settings);
  const savedModels = saved.models ?? [];
  const update = useLearningStore((state) => state.updateSettings);
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl === "https://api.openai.com/v1" ? "https://opencode.ai/inference/openai/v1" : saved.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(saved.model);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(() => !saved.model || !hasSessionAPIKey());

  async function editConfiguration() {
    const existingKey = await getClientAPIKey();
    setBaseUrl(saved.baseUrl);
    setApiKey(existingKey);
    setSelectedModel(saved.model);
    setMessage("");
    setIsEditing(true);
  }

  async function loadModels() {
    setBusy(true);
    setMessage("");
    try {
      const credential = await encryptAPIKey(apiKey);
      const response = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl, credential }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "获取模型失败。");
      update({ models: data.models });
      setSelectedModel(data.models.includes(saved.model) ? saved.model : data.models[0] ?? "");
      setMessage(data.models.length ? `已获取 ${data.models.length} 个模型，请选择后确认。` : "接口连接成功，但没有返回可选模型。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "连接失败。");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!baseUrl || !apiKey || !selectedModel) {
      setMessage("请填写接口地址和 API Key，并选择模型。");
      return;
    }
    await saveClientAPIKey(apiKey);
    update({ baseUrl: baseUrl.replace(/\/$/, ""), model: selectedModel });
    setApiKey("");
    setMessage("");
    setIsEditing(false);
  }

  return <VStack gap={5} className="mx-auto w-full max-w-5xl px-5 py-8">
    <HStack as="header" hAlign="between" wrap="wrap" gap={3}><Heading level={2}>EnglishFlow</Heading><Button label="首页" href="/" variant="ghost" /></HStack>
    <VStack gap={1}><Text type="label">SETTINGS</Text><Heading level={1}>连接 AI 模型</Heading><Text>使用 OpenAI 兼容接口获取模型，并将它用于练习生成与 AI 助教。</Text></VStack>
    {!isEditing && saved.model ? <Card><VStack gap={4}><HStack hAlign="between" wrap="wrap" vAlign="center"><VStack gap={1}><HStack gap={2} vAlign="center"><Heading level={2}>已连接</Heading><Badge label="可用" variant="success" /></HStack><Text type="supporting">AI Key 已加密保存在当前浏览器会话中。</Text></VStack><Button label="编辑配置" variant="secondary" onClick={editConfiguration} /></HStack><VStack gap={1}><Text type="label">兼容接口</Text><Text>{saved.baseUrl}</Text></VStack><VStack gap={1}><Text type="label">已选模型</Text><Text>{saved.model}</Text></VStack></VStack></Card> : <Card><VStack gap={4}>
      <TextInput label="兼容接口 Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="https://api.example.com/v1" />
      <TextInput label="API Key" type="password" value={apiKey} onChange={setApiKey} placeholder="输入服务商提供的 API Key" />
      <Button label={busy ? "正在获取模型…" : "获取可选模型"} variant="secondary" isDisabled={busy || !baseUrl || !apiKey} onClick={loadModels} />
      {savedModels.length > 0 ? <VStack gap={2}><Text type="label">选择模型</Text><DropdownMenu button={{ label: selectedModel || "请选择模型", variant: "secondary" }} items={savedModels.map((model) => ({ id: model, label: model, onClick: () => setSelectedModel(model) }))} /></VStack> : <TextInput label="当前模型" value={selectedModel} onChange={setSelectedModel} isReadOnly />}
      {message && <Banner status="error" title="配置提示" description={message} />}
      <HStack gap={2} wrap="wrap"><Button label="确认并保存" variant="primary" isDisabled={!selectedModel || busy} onClick={confirm} />{saved.model && <Button label="取消" variant="ghost" onClick={() => { setBaseUrl(saved.baseUrl); setSelectedModel(saved.model); setIsEditing(false); }} />}</HStack>
      <Text type="supporting">AI Key 使用 AES-GCM 加密写入当前浏览器会话；关闭或刷新页面后需重新填写。它不会写入本地持久化存储。</Text>
    </VStack></Card>}
  </VStack>;
}

