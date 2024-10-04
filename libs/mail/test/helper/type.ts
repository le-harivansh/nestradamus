/**
 * Result of querying a message by its id.
 */
export interface MessageSummary {
  ID: string;
  MessageID: string;
  Date: string;
  Size: number;
  ReturnPath: string;
  Subject: string;
  From: Address;
  To: Address;
  Bcc: Address[];
  Cc: Address[];
  ReplyTo: Address[];
  HTML: string;
  Text: string;
  Attachments: Attachment[];
  Inline: Attachment[];
  Tags: string[];
}

/**
 * Result of searching for messages.
 */
export interface MessagesSummary {
  messages_count: number;
  start: number;
  tags: string[];
  total: number;
  unread: number;
  messages: MessageSnippet[];
}

interface MessageSnippet {
  ID: string;
  MessageID: string;
  Created: string;
  Read: boolean;
  Subject: string;
  From: Address;
  To: Address[];
  Cc: Address[];
  Bcc: Address[];
  ReplyTo: Address[];
  Attachments: number;
  Size: number;
  Snippet: string;
  Tags: string[];
}

interface Address {
  Address: string;
  Name: string;
}

interface Attachment {
  ContentID: string;
  ContentType: string;
  FileName: string;
  PartID: string;
  Size: number;
}
