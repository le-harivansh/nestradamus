import { XOR } from '@/_library/type';

export type TemplateOptions = XOR<{ template: string }, { path: string }> & {
  variables?: Record<string, unknown>;
};
