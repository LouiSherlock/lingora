import {defineTheme} from '@astryxdesign/core/theme';
import {butterTheme as _astryxTheme0} from "@astryxdesign/theme-butter/built";

export default defineTheme({
  name: 'lingora',
  extends: _astryxTheme0,
  tokens: {
    // '--color-accent': ['#FF4500', '#FF7A45'],   // [亮色, 暗色]
    // '--radius-container': '32px',
  },
  localTokens: {
    '--layout-page-width': '64rem',
  },
  components: {
    banner: {
      'status:error': {
        color: 'var(--color-on-dark)',
      },
    },
  },
});