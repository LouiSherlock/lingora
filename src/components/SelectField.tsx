'use client';
import * as stylex from '@stylexjs/stylex';
import { ChevronDown } from 'lucide-react';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

type SelectFieldProps = {
  /** Visible field label. */
  label: string;
  /** Current selection; the placeholder shows when it is empty. */
  value?: string;
  placeholder?: string;
  isDisabled?: boolean;
  onClick: () => void;
};

const styles = stylex.create({
  trigger: {
    alignItems: 'center',
    backgroundColor: {
      // 不要用关键字 transparent：它会和 Astryx 的 .xjbqb8w 同哈希，而本项目
      // runtimeInjection 会把它注入为无层规则，导致列表项的 :hover 被覆盖。
      default: 'rgba(0, 0, 0, 0)',
      ':hover': 'var(--color-neutral)',
    },
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    // 不显式写 color：它会生成和 Astryx 按钮同哈希的 .x1tgivj0，
    // runtimeInjection 注入的无层规则会盖掉主题里 secondary 按钮的强调色。
    // 按钮已从页面继承 --color-text-primary，无需重复声明。
    cursor: {
      default: 'pointer',
      ':disabled': 'default',
    },
    display: 'flex',
    fontFamily: 'inherit',
    fontSize: 15,
    gap: 'var(--spacing-2)',
    justifyContent: 'space-between',
    minHeight: 'var(--size-element-md)',
    opacity: {
      default: 1,
      ':disabled': 0.6,
    },
    outlineColor: 'var(--focus-outline-color)',
    outlineOffset: 2,
    outlineStyle: 'none',
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
    textAlign: 'start',
    transitionDuration: 'var(--duration-fast)',
    transitionProperty: 'background-color, border-color',
    width: '100%',
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: 'var(--focus-outline-width)',
    },
  },
  value: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  placeholder: {
    color: 'var(--color-text-secondary)',
  },
  icon: {
    color: 'var(--color-text-secondary)',
    flexShrink: 0,
  },
});

/**
 * A form-field trigger that looks like an input with a dropdown chevron but
 * opens a caller-owned selection surface, such as a BottomSheet.
 */
export function SelectField({ label, value, placeholder = '请选择', isDisabled = false, onClick }: SelectFieldProps) {
  return <VStack gap={1}>
    <Text type="label" color="secondary">{label}</Text>
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${label}：${value || placeholder}`}
      disabled={isDisabled}
      onClick={onClick}
      {...stylex.props(styles.trigger)}
    >
      <span {...stylex.props(styles.value, !value && styles.placeholder)}>{value || placeholder}</span>
      <ChevronDown size={16} aria-hidden="true" {...stylex.props(styles.icon)} />
    </button>
  </VStack>;
}
