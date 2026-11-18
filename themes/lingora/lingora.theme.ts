// The lingora theme. `astryx experimental theme editor` wrote this file once and never changes it again.
// The checked settings live in lingora.settings.json and the generated lingora.settings.ts;
// change them with `astryx experimental theme editor set lingora ...`. Add your own changes below: they win over the settings.
import {defineTheme} from '@astryxdesign/core/theme';
import {lingoraSettings} from './lingora.settings';

export const lingoraTheme = defineTheme({
  extends: lingoraSettings,
  name: 'lingora',
});
