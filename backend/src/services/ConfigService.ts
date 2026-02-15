import { PrismaClient, SystemConfig } from '@prisma/client';

export class ConfigService {
  constructor(private prisma: PrismaClient) {}

  async get(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    return config?.value ?? null;
  }

  async set(key: string, value: string): Promise<SystemConfig> {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getLocale(): Promise<string> {
    const val = await this.get('locale');
    return val === 'en' ? 'en' : 'es';
  }

  async setLocale(locale: string): Promise<void> {
    if (locale !== 'es' && locale !== 'en') throw new Error('Invalid locale. Must be "es" or "en"');
    await this.set('locale', locale);
  }
}
