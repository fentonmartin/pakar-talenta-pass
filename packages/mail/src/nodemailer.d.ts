declare module 'nodemailer' {
  export interface SentMessageInfo {
    messageId: string;
    envelope?: {
      from: string;
      to: string[];
    };
  }

  export interface Transporter {
    sendMail(mail: SendMailOptions): Promise<SentMessageInfo>;
    verify(): Promise<boolean>;
    close(): void;
  }

  export interface SendMailOptions {
    from?: string | { name?: string; address?: string };
    to?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    attachments?: unknown[];
    [key: string]: unknown;
  }

  export interface TransporterOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
    from?: string;
    [key: string]: unknown;
  }

  export function createTransport(opts: TransporterOptions | string): Transporter;
}
