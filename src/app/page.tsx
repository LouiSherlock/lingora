import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Badge } from "@astryxdesign/core/Badge";

const recommendations = [
  { title: "Present Simple", detail: "一般现在时 · A1", count: "5 题", icon: "☀️", topic: "一般现在时" },
  { title: "Past Simple", detail: "一般过去时 · A2", count: "5 题", icon: "🕰️", topic: "一般过去时" },
  { title: "English Vocabulary", detail: "日常词汇 · A2", count: "5 题", icon: "💬", topic: "日常词汇" },
];

export default function Home() {
  return (
    <VStack gap={8} className="mx-auto w-full max-w-5xl px-5 py-8">
        <HStack as="header" wrap="wrap" hAlign="between" vAlign="center" gap={4} className="border-b border-border pb-4">
          <HStack gap={2} vAlign="center"><Heading level={2}>EnglishFlow</Heading><Badge label="MVP" variant="yellow" /></HStack>
          <HStack as="nav" wrap="wrap" vAlign="center" gap={2}>
            <Button label="首页" href="/" variant="ghost" />
            <Button label="AI 练习" href="/practice/create" variant="ghost" />
            <Button label="语法知识库" href="/grammar" variant="ghost" />
            <Button label="设置" href="/settings" variant="ghost" />
          </HStack>
        </HStack>

        <HStack wrap="wrap" hAlign="between" vAlign="center" gap={6}>
          <VStack gap={2}>
            <Text type="label">YOUR ENGLISH PRACTICE SPACE</Text>
            <Heading level={1}>今天想练什么？</Heading>
            <Text>设定目标，AI 会为你生成一组专属英语练习。</Text>
          </VStack>
          <Button label="开始 AI 练习" href="/practice/create" variant="primary" />
        </HStack>

        <Card>
          <HStack wrap="wrap" hAlign="between" vAlign="center" gap={6}>
            <VStack gap={2}>
              <Text type="label">AI POWERED</Text>
              <Heading level={2}>Create your practice</Heading>
              <Text>选择英语等级和知识点，快速开始一段有针对性的练习。</Text>
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
                  <HStack hAlign="between" vAlign="center"><Text type="label">{item.count}</Text><Button label="开始练习" href={`/practice/create?topic=${encodeURIComponent(item.topic)}`} variant="secondary" /></HStack>
                </VStack>
              </Card>
            ))}
          </section>
        </VStack>
    </VStack>
  );
}
