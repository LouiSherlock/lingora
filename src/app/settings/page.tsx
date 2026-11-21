import { VStack } from "@astryxdesign/core/VStack";
import { SettingsContent } from "@/components/SettingsSheet";
import { Toolbar } from "@/components/Toolbar";

export const instant = false;

export default function SettingsPage() {
  return (
    <VStack gap={6} className="page-container page-container--regular">
      <Toolbar title="设置" />
      <SettingsContent />
    </VStack>
  );
}
