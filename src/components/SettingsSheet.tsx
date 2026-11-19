"use client";
import { useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { motion } from "motion/react";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { encryptAPIKey, getClientAPIKey, hasClientAPIKey, saveClientAPIKey, setClientAPIKeyRemembered } from "../lib/client-ai";
import { useLearningStore } from "../stores/learning-store";

const triggerStyles = stylex.create({
  settings: {
    appearance: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 4px",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--color-accent)',
  },
});

export function SettingsSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const saved = useLearningStore((state) => state.settings);
  const savedModels = saved.models ?? [];
  const update = useLearningStore((state) => state.updateSettings);
  const rememberKey = saved.rememberKey ?? true;
  const [baseUrl, setBaseUrl] = useState(saved.baseUrl === "https://api.openai.com/v1" ? "https://opencode.ai/inference/openai/v1" : saved.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(saved.model);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [rememberError, setRememberError] = useState("");
  const [isEditing, setIsEditing] = useState(() => !saved.model || !hasClientAPIKey());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setSelectedModel(saved.model);
    setBaseUrl(saved.baseUrl === "https://api.openai.com/v1" ? "https://opencode.ai/inference/openai/v1" : saved.baseUrl);
  }, [saved.baseUrl, saved.model]);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    void getClientAPIKey().then((key) => {
      if (!active) return;
      setApiKey(key);
      setIsEditing(!saved.model || !key);
    }).catch(() => { if (active) { setApiKey(""); setIsEditing(true); } });
    return () => { active = false; };
  }, [hydrated, saved.model]);

  useEffect(() => {
    if (rememberKey) {
      void Promise.resolve().then(() => {
        try {
          setClientAPIKeyRemembered(true);
        } catch {
          setRememberError("无法在此浏览器中记住 API Key，请检查存储权限。");
        }
      });
    }
  }, []);

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
      const preferredModel = selectedModel || saved.model;
      update({ models: data.models });
      setSelectedModel(data.models.includes(preferredModel) ? preferredModel : data.models[0] ?? "");
      setMessage(data.models.length ? "" : "接口连接成功，但没有返回可选模型。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "连接失败。");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "");
    if (!normalizedBaseUrl || !apiKey.trim() || !selectedModel.trim()) {
      setMessage("请完整填写接口地址、API Key，并选择模型。");
      return;
    }
    try {
      const parsedUrl = new URL(normalizedBaseUrl);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") throw new Error();
    } catch {
      setMessage("请输入有效的 HTTP 或 HTTPS 接口地址。");
      return;
    }
    if (savedModels.length > 0 && !savedModels.includes(selectedModel)) {
      setMessage("所选模型不在可用模型列表中，请重新选择或获取模型。");
      return;
    }
    try {
      await saveClientAPIKey(apiKey, rememberKey);
      update({ baseUrl: normalizedBaseUrl, model: selectedModel, models: savedModels });
      setApiKey("");
      setMessage("");
      setIsEditing(false);
      setIsOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法保存配置，请检查浏览器存储权限后重试。");
    }
  }

  return <>
    <motion.button type="button" {...stylex.props(triggerStyles.settings)} onClick={() => setIsOpen(true)} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>设置</motion.button>
    <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen} label="AI 设置" height="tall">

    <VStack gap={2}>
      <Switch
        label="记住 API Key"
        value={rememberKey}
        description={rememberKey ? "加密保存在当前浏览器中，之后打开页面仍可使用。" : "仅保存在当前标签页会话中，关闭标签页后需要重新输入。"}
        onChange={(checked) => {
          try {
            setClientAPIKeyRemembered(checked);
            update({ rememberKey: checked });
            setRememberError("");
          } catch {
            setRememberError("无法更新 API Key 保存设置，请检查浏览器存储权限。");
          }
        }}
      />
      {rememberError && <Banner status="error" title="保存设置失败" description={rememberError} />}
    </VStack>
    {!isEditing && saved.model ? <Card><VStack gap={4}><HStack hAlign="between" wrap="wrap" vAlign="center"><VStack gap={1}><HStack gap={2} vAlign="center"><Heading level={2}>已连接</Heading><Badge label="可用" variant="success" /></HStack><Text type="supporting">AI Key 已加密保存在当前浏览器中。</Text></VStack><Button label="编辑配置" variant="secondary" onClick={editConfiguration} /></HStack><VStack gap={1}><Text type="label">兼容接口</Text><Text>{saved.baseUrl}</Text></VStack><VStack gap={1}><Text type="label">已选模型</Text><Text>{saved.model}</Text></VStack></VStack></Card> : <Card><VStack gap={4}>
      <TextInput label="兼容接口地址" value={baseUrl} onChange={setBaseUrl} placeholder="https://api.example.com/v1" />
      <TextInput label="API Key" type="password" value={apiKey} onChange={setApiKey} placeholder="请输入服务商提供的密钥" />
      <Button label={busy ? "正在获取模型…" : "获取可选模型"} variant="secondary" isDisabled={busy || !baseUrl || !apiKey} onClick={loadModels} />
      {savedModels.length > 0 ? <VStack gap={2} hAlign="start"><Text type="label">选择模型</Text><DropdownMenu button={{ label: selectedModel || "请选择模型", variant: "secondary", className: "justify-start text-left" }} items={savedModels.map((model) => ({ id: model, label: model, onClick: () => setSelectedModel(model) }))} /></VStack> : <TextInput label="当前模型" value={selectedModel} onChange={setSelectedModel} isReadOnly />}
      {message && <Banner status="error" title="配置提示" description={message} />}
      <HStack gap={2} wrap="wrap"><Button label="确认并保存" variant="primary" isDisabled={!selectedModel || busy} onClick={confirm} />{saved.model && <Button label="取消" variant="ghost" onClick={() => { setBaseUrl(saved.baseUrl); setSelectedModel(saved.model); setIsEditing(false); }} />}</HStack>
      <Text type="supporting">AI Key 使用 AES-GCM 加密后保存在浏览器中。保存方式由“记住 API Key”控制。</Text>
    </VStack></Card>}
    </BottomSheet>
  </>;
}


