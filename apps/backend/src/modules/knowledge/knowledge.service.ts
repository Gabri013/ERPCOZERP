import { prisma } from '../../infra/prisma.js';
import type { Prisma } from '@prisma/client';

export async function listCategories() {
  return prisma.knowledgeCategory.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createCategory(data: { name: string; icon?: string; color?: string; description?: string; sortOrder?: number }) {
  return prisma.knowledgeCategory.create({ data });
}

export async function updateCategory(id: string, data: Partial<{ name: string; icon: string; color: string; description: string; sortOrder: number }>) {
  return prisma.knowledgeCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.knowledgeCategory.delete({ where: { id } });
}

export async function listArticles(filters: { categoryId?: string; status?: string; search?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { summary: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.knowledgeArticle.findMany({
    where,
    include: { category: true, _count: { select: { revisions: true, attachments: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getArticle(idOrSlug: string) {
  return prisma.knowledgeArticle.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { category: true, revisions: { orderBy: { createdAt: 'desc' } }, attachments: true },
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now();
}

export async function createArticle(data: {
  categoryId: string;
  title: string;
  content: string;
  summary?: string;
  status?: string;
  visibility?: string;
  subcategory?: string;
  author?: string;
  tags?: Prisma.InputJsonValue;
}) {
  const slug = generateSlug(data.title);
  return prisma.knowledgeArticle.create({ data: { ...data, slug } as Prisma.KnowledgeArticleUncheckedCreateInput });
}

export async function updateArticle(id: string, data: Partial<{
  title: string;
  content: string;
  summary: string;
  status: string;
  visibility: string;
  subcategory: string;
  author: string;
  tags: Prisma.InputJsonValue;
  version: string;
}>) {
  return prisma.knowledgeArticle.update({ where: { id }, data });
}

export async function deleteArticle(id: string) {
  return prisma.knowledgeArticle.delete({ where: { id } });
}

export async function incrementViews(id: string) {
  return prisma.knowledgeArticle.update({ where: { id }, data: { views: { increment: 1 } } });
}

export async function likeArticle(id: string) {
  return prisma.knowledgeArticle.update({ where: { id }, data: { likes: { increment: 1 } } });
}

export async function addRevision(articleId: string, data: { version: string; content: string; description?: string; author?: string }) {
  return prisma.knowledgeRevision.create({ data: { articleId, ...data } });
}

export async function addAttachment(articleId: string, data: { fileName: string; fileSize?: string; path?: string }) {
  return prisma.knowledgeAttachment.create({ data: { articleId, ...data } });
}

export async function getKnowledgeStats() {
  const [totalArticles, totalCategories, byStatus] = await Promise.all([
    prisma.knowledgeArticle.count(),
    prisma.knowledgeCategory.count(),
    prisma.knowledgeArticle.groupBy({ by: ['status'], _count: true }),
  ]);
  return { totalArticles, totalCategories, byStatus };
}
