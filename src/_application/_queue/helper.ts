import Bull, { Queue } from 'bull';

export type QueueOf<T> = Queue<JobTypesOfProcessorMethodsFrom<T>>;

type JobTypesOfProcessorMethodsFrom<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? Parameters<T[K]>[0] extends Bull.Job<infer U>
      ? U
      : never
    : never;
}[keyof T];
