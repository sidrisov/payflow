import { FlowType } from './FlowType';
import { ProfileType } from './ProfileType';

export interface JarType {
  flow: FlowType;
  profile: ProfileType;
  description?: string;
  image?: string;
  link?: string;
}
