"use client";

import { ArrowLeft } from "lucide-react";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { IconButton } from "@astryxdesign/core/IconButton";

type ToolbarProps = {
  /** 居中显示的标题；不传则只显示返回与右侧操作。 */
  title?: string;
  /** 返回按钮跳转地址；提供 onBack 时优先使用 onBack。 */
  backHref?: string;
  onBack?: () => void;
  /** 右侧操作区：原先与返回按钮同一行的元素放这里。 */
  endContent?: React.ReactNode;
};

/**
 * 安卓风格顶部标题栏：左侧返回箭头、居中标题、右侧操作。
 * 除首页外的页面统一使用它，替代原来只有返回按钮的那一行。
 */
export function Toolbar({ title, backHref = "/", onBack, endContent }: ToolbarProps) {
  return (
    <header className="app-toolbar">
      <IconButton
        className="app-toolbar__back"
        label="返回"
        icon={<ArrowLeft size={20} />}
        variant="ghost"
        href={backHref}
        onClick={onBack}
      />
      {title
        ? <Heading level={3} className="app-toolbar__title">{title}</Heading>
        : <span className="app-toolbar__title" aria-hidden="true" />}
      <HStack gap={1} vAlign="center" className="app-toolbar__actions">
        {endContent}
      </HStack>
    </header>
  );
}
