import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/** Argon2id (дефолт библиотеки) с параметрами по умолчанию — рекомендация OWASP на 2026 год. */
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return verify(passwordHash, password);
  }
}
