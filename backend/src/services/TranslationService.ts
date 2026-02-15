import { PrismaClient, Translation } from '@prisma/client';

export class TranslationService {
  constructor(private prisma: PrismaClient) {}

  async getAll(page = 1, limit = 50, search?: string, category?: string): Promise<{ data: Translation[]; total: number }> {
    const where: any = {};
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { es: { contains: search, mode: 'insensitive' } },
        { en: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.translation.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { key: 'asc' } }),
      this.prisma.translation.count({ where }),
    ]);
    return { data, total };
  }

  async getByLocale(locale: string): Promise<Record<string, string>> {
    if (locale !== 'es' && locale !== 'en') throw new Error('Invalid locale');
    const translations = await this.prisma.translation.findMany();
    const map: Record<string, string> = {};
    for (const t of translations) {
      map[t.key] = locale === 'es' ? t.es : t.en;
    }
    return map;
  }

  async create(data: { key: string; es: string; en: string; category?: string }): Promise<Translation> {
    if (!data.key || !data.key.trim()) throw new Error('Key cannot be empty');
    const existing = await this.prisma.translation.findUnique({ where: { key: data.key } });
    if (existing) throw new Error('Key already exists');
    return this.prisma.translation.create({ data: { key: data.key.trim(), es: data.es, en: data.en, category: data.category || 'general' } });
  }

  async update(id: string, data: Partial<{ es: string; en: string; category: string }>): Promise<Translation> {
    return this.prisma.translation.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.translation.delete({ where: { id } });
  }
}
