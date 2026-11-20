"use client";
import { useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { motion } from "motion/react";
import { Banner } from "@astryxdesign/core/Banner";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";
import { discardLegacyCredential } from "../lib/client-ai";
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
  const update = useLearningStore((state) => state.updateSettings);
  const [models, setModels] = useState<string[]>(saved.models ?? []);
  const [selectedModel, setSelectedModel] = useState(saved.model);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    discardLegacyCredential();
  }, []);

  async function loadModels() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/models", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "获取模型失败。");
      const list: string[] = Array.isArray(data.models) ? data.models : [];
      setModels(list);
      update({ models: list });
      setSelectedModel((current) => (current && list.includes(current) ? current : list[0] ?? ""));
      if (!list.length) setMessage("接口连接成功，但没有返回可选模型，可直接填写模型名称。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "连接失败。");
    } finally {
      setBusy(false);
    }
  }

  function open() {
    setIsOpen(true);
    setMessage("");
    setSelectedModel(saved.model);
    setModels(saved.models ?? []);
    if (!saved.models?.length) void loadModels();
  }

  function confirm() {
    const model = selectedModel.trim();
    if (!model) {
      setMessage("请先选择模型。");
      return;
    }
    update({ model, models });
    setIsOpen(false);
  }

  return <>
    <motion.button type="button" {...stylex.props(triggerStyles.settings)} onClick={open} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>设置</motion.button>
    <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen} label="AI 设置" height="tall">
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={2}>AI 设置</Heading>
          <Text>API Key 与接口地址已由服务端配置，只需选择模型。</Text>
        </VStack>
        <Card><VStack gap={4}>
          {models.length > 0
            ? <Selector label="选择模型" options={models.map((model) => ({ value: model, label: model }))} value={selectedModel} onChange={setSelectedModel} placeholder="请选择模型" presentation="bottom-sheet" />
            : <TextInput label="模型名称" value={selectedModel} onChange={setSelectedModel} placeholder={busy ? "正在获取模型…" : "例如：gpt-4o-mini"} />}
          {message && <Banner status="error" title="配置提示" description={message} />}
          <HStack gap={2} wrap="wrap">
            <Button label={busy ? "正在获取模型…" : "刷新模型列表"} variant="secondary" isDisabled={busy} onClick={loadModels} />
            <Button label="保存" variant="primary" isDisabled={busy || !selectedModel.trim()} onClick={confirm} />
          </HStack>
        </VStack></Card>
      </VStack>
    </BottomSheet>
  </>;
}
