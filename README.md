import {defineTheme} from '@astryxdesign/core/theme';
import {neutral} from '@astryxdesign/theme-neutral'; // 导出名见下面的提醒

export const brandTheme = defineTheme({
  name: 'brand',
  extends: neutral,
  tokens: {
    '--color-accent': ['#FF4500', '#FF7A45'],   // [亮色, 暗色]
    '--radius-container': '12px',
  },
  components: {
    button: {
      base: {fontWeight: '600'},
    },
  },
});