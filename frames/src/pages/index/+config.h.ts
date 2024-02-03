export { config };

import type { Config } from 'vike/types';
import vikeReact from 'vike-react/config';

// Default configs (can be overridden by pages)
const config = {
  title: 'Payflow | Frames',
  extends: vikeReact
} satisfies Config;
