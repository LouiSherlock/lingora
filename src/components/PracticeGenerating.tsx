import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export function PracticeGenerating({ title = "正在为你编织练习", description = "正在根据你的等级和主题准备题目…" }: { title?: string; description?: string }) {
  return <VStack gap={3} hAlign="center" vAlign="center" className="practice-generating" role="status" aria-live="polite">
    <svg className="practice-generating__art" viewBox="0 0 160 160" role="img" aria-label={title}>
      <circle className="practice-generating__orbit" cx="80" cy="80" r="57" fill="none" stroke="currentColor" strokeDasharray="3 9" strokeWidth="2" />
      <path className="practice-generating__loop" d="M80 28 96 58 132 62 106 88 112 124 80 108 48 124 54 88 28 62 64 58Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="3" />
      <circle className="practice-generating__core" cx="80" cy="80" r="13" fill="currentColor" />
      <circle className="practice-generating__spark" cx="30" cy="80" r="4" fill="currentColor" />
      <circle className="practice-generating__spark practice-generating__spark--late" cx="130" cy="80" r="4" fill="currentColor" />
    </svg>
    <Heading level={2}>{title}</Heading>
    <Text>{description}</Text>
  </VStack>;
}
