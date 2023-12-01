import { XOR } from '@/_library/helper';

export type TemplateOptions = XOR<{ template: string }, { path: string }> & {
  variables?: Record<string, unknown>;
};
