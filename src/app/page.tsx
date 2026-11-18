"use client";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { useLearningStore } from "../stores/learning-store";

const recommendations = [
  { title: "Present Simple", detail: "一般现在时 · A1", count: "10 题", icon: "☀️" },
  { title: "Past Simple", detail: "一般过去时 · A2", count: "10 题", icon: "🕰️" },
  { title: "English Vocabulary", detail: "日常词汇 · A2", count: "10 题", icon: "💬" },
];

export default function Home() {
  const history = useLearningStore((s) => s.history);
  return (
    <VStack gap={8} className="mx-auto w-full max-w-6xl px-5 py-6">
        <HStack as="header" wrap="wrap" hAlign="between" vAlign="center" gap={4} className="border-b border-border pb-4">
          <Heading level={2}>EnglishFlow</Heading>
          <HStack as="nav" wrap="wrap" vAlign="center" gap={2}>
            <Button label="首页" href="/" variant="ghost" />
            <Button label="AI 练习" href="/practice/create" variant="ghost" />
            <Button label="语法知识库" href="/grammar" variant="ghost" />
            <Button label="设置" href="/settings" variant="ghost" />
          </HStack>
        </HStack>

        <HStack wrap="wrap" hAlign="between" vAlign="center" gap={4}>
          <VStack gap={1}>
            <Text type="supporting">WEDNESDAY, NOVEMBER 18</Text>
            <Heading level={1}>Good afternoon!</Heading>
            <Text>今天也来提升一下你的英语水平吧。</Text>
          </VStack>
          <Button label="开始 AI 练习" href="/practice/create" variant="primary" />
        </HStack>

        <Card>
          <HStack wrap="wrap" hAlign="between" vAlign="center" gap={6}>
            <VStack gap={2}>
              <Text type="label">AI POWERED</Text>
              <Heading level={2}>Create your practice</Heading>
              <Text>根据你的英语水平，生成个性化练习。</Text>
            </VStack>
            <Button label="创建专属练习" href="/practice/create" variant="primary" />
          </HStack>
        </Card>

        <VStack gap={4}>
          <HStack hAlign="between" vAlign="center">
            <VStack gap={1}><Heading level={2}>推荐练习</Heading><Text type="supporting">从一个熟悉的主题开始热身</Text></VStack>
            <Button label="查看全部" href="/practice/create" variant="ghost" />
          </HStack>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {recommendations.map((item) => (
              <Card key={item.title}>
                <VStack gap={4}>
                  <Text type="display-2">{item.icon}</Text>
                  <VStack gap={1}><Heading level={3}>{item.title}</Heading><Text type="supporting">{item.detail}</Text></VStack>
                  <HStack hAlign="between" vAlign="center"><Text type="label">{item.count}</Text><Button label="开始练习" href="/practice/create" variant="secondary" /></HStack>
                </VStack>
              </Card>
            ))}
          </section>
        </VStack>
    </VStack>
  );
}
