import mailhog, { API, Message, Options } from 'mailhog';
import { nextTick } from 'node:process';

export class Mailhog {
  /**
   * This combination of characters is used as the newline in (Mailhog) emails.
   *
   * They are used when querying emails through Mailhog's API.
   */
  static readonly NEWLINE = '=\r\n';

  readonly api: API;

  constructor(options?: Options) {
    this.api = mailhog(options);
  }

  async getLatestEmail(
    criteria: {
      contents: string;
      notBefore: Date;
      to?: string;
    },
    options?: {
      initialWaitMs?: number;
      checkIntervalMs?: number;
      maxWaitingTimeMs?: number;
    },
  ): Promise<Message> {
    return new Promise(async (resolve, reject) => {
      const { contents, notBefore, to = undefined } = criteria;
      const {
        initialWaitMs = 100,
        checkIntervalMs = 100,
        maxWaitingTimeMs = 1000,
      } = options ?? {};

      await this.waitFor(initialWaitMs);

      for (
        let currentDuration = initialWaitMs;
        currentDuration <= maxWaitingTimeMs;
        currentDuration += checkIntervalMs
      ) {
        const latestEmail = await this.api.latestContaining(contents);

        if (
          latestEmail &&
          latestEmail.deliveryDate > notBefore &&
          (to ? latestEmail.to === to : true)
        ) {
          return resolve(latestEmail);
        }

        await this.waitFor(checkIntervalMs);
      }

      return reject({
        message: 'Could not find the specified email.',
        criteria: {
          notBefore,
          contents,
          to,
        },
        options: {
          initialWaitMs,
          checkIntervalMs,
          maxWaitingTimeMs,
        },
      });
    });
  }

  async deleteEmailsSentBetween(
    start: Date,
    end: Date,
    options?: { initialWaitMs: number },
  ) {
    const { initialWaitMs = 100 } = options ?? {};

    await this.waitFor(initialWaitMs);

    nextTick(async () => {
      const emailsToDelete = (await this.api.messages())?.items.filter(
        ({ deliveryDate }) =>
          deliveryDate.valueOf() >= start.valueOf() &&
          deliveryDate.valueOf() <= end.valueOf(),
      );

      if (!emailsToDelete) {
        return;
      }

      await Promise.all(
        emailsToDelete.map(({ ID: id }) => this.api.deleteMessage(id)),
      );
    });
  }

  private async waitFor(durationMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, durationMs));
  }
}
