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
import { useRouter } from "next/navigation";
import { useLearningStore } from "@/stores/learning-store.ts";
import { apiFetch, getToken, requestLogin } from "@/lib/auth-client";

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

/** 首页头部入口：点击后软导航到 /settings，由平行路由拦截弹出设置框。 */
export function SettingsSheetTrigger() {
  const router = useRouter();
  return (
    <motion.button
      type="button"
      {...stylex.props(triggerStyles.settings)}
      onClick={() => {
        // 未登录时先弹登录框，避免导航到 /settings 被 AuthGuard 拦截后留下空白/卡住的弹窗。
        if (!getToken()) {
          requestLogin();
          return;
        }
        router.push("/settings");
      }}
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      设置
    </motion.button>
  );
}

/**
 * 设置表单内容。被拦截路由（弹出框）和完整 /settings 页面共用。
 * `onClose` 在保存成功后调用，用于关闭弹出框。
 */
export function SettingsContent({ onClose }: { onClose?: () => void }) {
  const saved = useLearningStore((state) => state.settings);
  const update = useLearningStore((state) => state.updateSettings);
  const [models, setModels] = useState<string[]>(saved.models ?? []);
  const [selectedModel, setSelectedModel] = useState(saved.model);
  // 本地还没有模型列表时，挂载后会自动拉取一次，期间先按忙碌展示。
  const [busy, setBusy] = useState(() => !(saved.models?.length));
  const [message, setMessage] = useState("");

  async function fetchModels() {
    try {
      const response = await apiFetch("/api/models", { method: "POST" });
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

  function loadModels() {
    setBusy(true);
    setMessage("");
    void fetchModels();
  }

  // 首次挂载且本地没有模型列表时自动拉取一次（与之前点击「设置」时一致）。
  // fetchModels 的 setState 都在 await 之后异步触发，并非在 effect 内同步执行。
  useEffect(() => {
    if (!saved.models?.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function confirm() {
    const model = selectedModel.trim();
    if (!model) {
      setMessage("请先选择模型。");
      return;
    }
    update({ model, models });
    onClose?.();
  }

  return (
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
  );
}

/** 拦截路由用的弹出框：打开即展示，关闭时返回上一页。 */
export function SettingsSheetModal() {
  const router = useRouter();
  return (
    <BottomSheet
      isOpen
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
      label="AI 设置"
      height="tall"
    >
      <SettingsContent onClose={() => router.back()} />
    </BottomSheet>
  );
}
