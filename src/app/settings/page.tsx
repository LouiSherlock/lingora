import { ArrowLeft } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { SettingsContent } from "@/components/SettingsSheet";

export const instant = false;

export default function SettingsPage() {
  return (
    <VStack gap={6} className="page-container page-container--regular">
      <HStack as="header" hAlign="start">
        <Button label="返回" icon={<ArrowLeft size={16} />} href="/" variant="ghost" />
      </HStack>
      <SettingsContent />
    </VStack>
  );
}
