"use client";

import { useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, BotMessageSquare } from "lucide-react";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Button } from "@astryxdesign/core/Button";
import { ChatComposer, ChatLayout, ChatMessage, ChatMessageBubble, ChatMessageList } from "@astryxdesign/core/Chat";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { getClientAISettings, type ClientAISettings } from "@/lib/client-ai";
import { answerLabel } from "@/lib/practice-grade";
import type { Question } from "@/lib/practice-data";
import { useLearningStore } from "@/stores/learning-store";

type TutorSheetProps = {
  question: Question;
  ai: ClientAISettings;
};

const EMPTY_TUTOR_MESSAGES: UIMessage[] = [];

/** 刷新后从地址栏恢复助教面板的展开状态。 */
function readTutorOpenFromURL() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tutor") === "open";
}

export function TutorSheet({ question, ai }: TutorSheetProps) {
  const [isOpen, setIsOpen] = useState(readTutorOpenFromURL);
  const [draft, setDraft] = useState("");

  /**
   * URL 只作为刷新恢复用的标记；用 replaceState 更新，避免触发 Next 路由
   * 导航（否则可能重渲染并中断正在进行的回答）。
   */
  function setTutorOpen(open: boolean) {
    setIsOpen(open);
    const url = new URL(window.location.href);
    if (open) url.searchParams.set("tutor", "open");
    else url.searchParams.delete("tutor");
    window.history.replaceState(window.history.state, "", url);
  }
  const tutorMessages = useLearningStore((s) => s.tutorMessages);
  const setTutorMessages = useLearningStore((s) => s.setTutorMessages);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/explain" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({
    // 只作为挂载时的初始消息；刷新后从 store 恢复。
    messages: tutorMessages ?? EMPTY_TUTOR_MESSAGES,
    transport,
  });
  const isStreaming = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  // 发出后到第一个 assistant 消息出现之前，先渲染一个“思考中”占位。
  const showsPendingAssistant = isStreaming && lastMessage?.role !== "assistant";
  const assistantAvatar = <Icon icon={Bot} size="lg" color="accent" />;

  // 流式期间不写 localStorage；提交时先存用户问题，完成后存完整回答。
  useEffect(() => {
    if (messages.length && (status === "submitted" || status === "ready")) {
      setTutorMessages(messages);
    }
  }, [messages, status, setTutorMessages]);

  async function ask(value: string) {
    const followUp = value.trim();
    if (!followUp || isStreaming) return;
    setDraft("");
    const clientAI = await getClientAISettings(ai);
    await sendMessage({ text: followUp }, {
      body: {
        question: question.stem,
        answer: answerLabel(question),
        options: question.options,
        ai: clientAI,
      },
    });
  }

  return <>
    <Button label="AI 助教" icon={<BotMessageSquare size={16} />} variant="secondary" onClick={() => setTutorOpen(true)} />
    <BottomSheet isOpen={isOpen} onOpenChange={setTutorOpen} label="AI 助教" height="tall" padding={0} purpose="info">
      <VStack gap={0} className="tutor-sheet">
        <HStack className="tutor-sheet__header" hAlign="between" vAlign="center">
          <VStack gap={1}>
            <Heading level={2}>AI 助教</Heading>
            <Text type="supporting">本次练习的对话会保留，刷新后仍可继续</Text>
          </VStack>
          <Button label="关闭" variant="ghost" size="sm" onClick={() => setTutorOpen(false)} />
        </HStack>
        <ChatLayout
          density="compact"
          composer={<ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={ask}
            onStop={stop}
            isStopShown={isStreaming}
            placeholder="例如：为什么这里要用现在完成时？"
            status={error ? { type: "error", message: error.message } : undefined}
          />}
          emptyState={<VStack gap={2} className="tutor-sheet__empty"><Heading level={3}>有什么想问的？</Heading><Text>我会结合当前题目、答案和解析为你说明。</Text></VStack>}
        >
          <ChatMessageList align="top" isStreaming={isStreaming}>
            {messages.map((message) => <ChatMessage key={message.id} sender={message.role} avatar={message.role === "assistant" ? assistantAvatar : null}>
              <ChatMessageBubble variant="filled">
                <Markdown density="compact">{message.parts.filter((part) => part.type === "text").map((part) => part.text).join("") || (message.role === "assistant" ? "正在思考…" : "")}</Markdown>
              </ChatMessageBubble>
            </ChatMessage>)}
            {showsPendingAssistant && <ChatMessage sender="assistant" avatar={assistantAvatar}>
              <ChatMessageBubble variant="filled">
                <Markdown density="compact">正在思考…</Markdown>
              </ChatMessageBubble>
            </ChatMessage>}
          </ChatMessageList>
        </ChatLayout>
      </VStack>
    </BottomSheet>
  </>;
}
