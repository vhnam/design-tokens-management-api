import { Injectable } from '@nestjs/common';
import { CreateEmailOptions, Resend } from 'resend';

import { env } from '../config/env.config';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendEmail(payload: CreateEmailOptions): Promise<void> {
    await this.resend.emails.send(payload);
  }
}
