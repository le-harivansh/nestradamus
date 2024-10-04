import axios from 'axios';

import { MessagesSummary, MessageSummary } from './type';

export class MailPit {
  constructor(private readonly baseUrl: string) {}

  async getMessageById(messageId: string) {
    const url = this.url(`/api/v1/message/${messageId}`);
    const { data: message } = await axios.get<MessageSummary>(url);

    return message;
  }

  async searchMessages(
    query: string,
    start: number = 0,
    limit: number = 50,
    tz: string = 'UTC',
  ) {
    const url = this.url('/api/v1/search', { query, start, limit, tz });
    const { data: messages } = await axios.get<MessagesSummary>(url);

    return messages;
  }

  async deleteMessagesBetween(start: Date, end: Date) {
    const url = this.url('/api/v1/search', {
      query: `before:"${end.getTime()}" after:"${start.getTime()}"`,
      tz: 'UTC',
    });

    await axios.delete(url);
  }

  private url(
    path: string,
    query: Record<string, string | number> = {},
  ): string {
    return [
      [
        // remove any ending '/'
        this.baseUrl.replace(/\/$/g, ''),
        // remove any starting '/' AND ending '/'
        path.replace(/^\/|\/$/g, ''),
      ].join('/'),
      Object.entries(query)
        .flatMap(([key, value]) => `${key}=${value}`)
        .join('&'),
    ].join('?');
  }
}
