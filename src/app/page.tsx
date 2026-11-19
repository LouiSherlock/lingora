'use client';

import { useState } from "react";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Badge } from "@astryxdesign/core/Badge";
import { Clock3, MessageCircle, Sun } from "lucide-react";
import { grammarTopics } from "../lib/practice-data";

const recommendations = [
  { title: "Present Simple", detail: "一般现在时 · A1", count: "5 题", icon: "☀️", topic: "一般现在时" },
  { title: "Past Simple", detail: "一般过去时 · A2", count: "5 题", icon: "🕰️", topic: "一般过去时" },
  { title: "English Vocabulary", detail: "日常词汇 · A2", count: "5 题", icon: "💬", topic: "日常词汇" },
];

export default function Home() {
  const [practiceSheetOpen, setPracticeSheetOpen] = useState(false);
  const [grammarSheetOpen, setGrammarSheetOpen] = useState(false);

  return (
    <VStack gap={8} className="page-container page-container--regular">
        <HStack as="header" wrap="wrap" hAlign="between" vAlign="center" gap={4} className="site-header">
          <HStack gap={2} vAlign="center"><Heading level={2} color="accent">Lingora</Heading></HStack>
          <Button label="设置" href="/settings" variant="ghost" />
        </HStack>

        <HStack wrap="wrap" hAlign="between" vAlign="center" gap={6}>
          <VStack gap={2}>
            <Text type="label">专属英语练习空间</Text>
            <Heading level={1}>今天想练什么？</Heading>
            <Text>设定目标，AI 会为你生成一组专属英语练习。</Text>
          </VStack>
          <Button label="开始 AI 练习" href="/practice/create" variant="primary" />
        </HStack>

        <VStack gap={4}>
          <HStack hAlign="between" vAlign="center">
            <VStack gap={1}><Heading level={2}>推荐练习</Heading><Text type="supporting">从一个熟悉的主题开始热身</Text></VStack>
            <Button label="查看全部" onClick={() => setPracticeSheetOpen(true)} variant="ghost" />
          </HStack>
          <section className="recommendation-grid">
            {recommendations.map((item) => (
              <Card key={item.title}>
                <VStack gap={4}>
                  {item.topic === "一般现在时" && <Sun aria-hidden="true" />}
                  {item.topic === "一般过去时" && <Clock3 aria-hidden="true" />}
                  {item.topic === "日常词汇" && <MessageCircle aria-hidden="true" />}
                  <VStack gap={1}><Heading level={3}>{item.title}</Heading><Text type="supporting">{item.detail}</Text></VStack>
                  <HStack hAlign="between" vAlign="center"><Text type="label">{item.count}</Text><Button label="开始练习" href={`/practice/create?topic=${encodeURIComponent(item.topic)}`} variant="secondary" /></HStack>
                </VStack>
              </Card>
            ))}
          </section>
        </VStack>

        <VStack gap={4}>
          <HStack hAlign="between" vAlign="center">
            <VStack gap={1}><Heading level={2}>语法大全</Heading><Text type="supporting">按主题系统复习英语语法</Text></VStack>
            <Button label="查看全部" onClick={() => setGrammarSheetOpen(true)} variant="ghost" />
          </HStack>
          <section className="recommendation-grid">
            {grammarTopics.slice(0, 3).map((topic) => (
              <Card key={topic.slug}>
                <VStack gap={4}>
                  <VStack gap={1}><Heading level={3}>{topic.title}</Heading><Text type="supporting">{topic.chinese} · {topic.level}</Text></VStack>
                  <Text type="supporting">{topic.summary}</Text>
                  <HStack hAlign="between" vAlign="center"><Text type="label">{topic.category}</Text><Button label="查看语法" href={`/grammar/${topic.slug}`} variant="secondary" /></HStack>
                </VStack>
              </Card>
            ))}
          </section>
        </VStack>

        <BottomSheet
          isOpen={practiceSheetOpen}
          onOpenChange={setPracticeSheetOpen}
          label="全部推荐练习"
          height="capped"
        >
          <VStack gap={4}>
            {recommendations.map((item) => (
              <Card key={item.title} variant="muted">
                <HStack hAlign="between" vAlign="center" gap={4}>
                  <VStack gap={1}><Heading level={3}>{item.title}</Heading><Text type="supporting">{item.detail}</Text></VStack>
                  <Button label="开始练习" href={`/practice/create?topic=${encodeURIComponent(item.topic)}`} variant="secondary" />
                </HStack>
              </Card>
            ))}
          </VStack>
        </BottomSheet>

        <BottomSheet
          isOpen={grammarSheetOpen}
          onOpenChange={setGrammarSheetOpen}
          label="语法大全"
          height="capped"
        >
          <VStack gap={4}>
            {grammarTopics.map((topic) => (
              <Card key={topic.slug} variant="muted">
                <HStack hAlign="between" vAlign="center" gap={4}>
                  <VStack gap={1}><Heading level={3}>{topic.title}</Heading><Text type="supporting">{topic.chinese} · {topic.level}</Text></VStack>
                  <Button label="查看语法" href={`/grammar/${topic.slug}`} variant="secondary" />
                </HStack>
              </Card>
            ))}
          </VStack>
        </BottomSheet>
    </VStack>
  );
}

