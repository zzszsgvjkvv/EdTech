import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { DEFAULT_AI_CATEGORIES, DEFAULT_TARGET_LANGUAGE, MAX_CATEGORY_NAME_LENGTH, MAX_CONVERSATION_TITLE_LENGTH, MAX_CHAT_MESSAGE_LENGTH } from './ai.constants';
import { AIHttpError } from './ai.errors';
import { AIConversation } from './models/ai-conversation.model';
import { AIMessage } from './models/ai-message.model';
import { AIIllustration } from './models/ai-illustration.model';
import { StudentAICategory } from './models/ai-category.model';
import { generateAndStoreIllustration, makeIllustrationCacheKey } from './services/ai-image.service';
import { generateTutorReply } from './services/openai-ai.service';
import { getUserId, optionalString, parsePagination, requireObjectId, requireString } from './ai.utils';

function categorySlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36) || 'learning-topic';
}

function requireRouteParam(value: string | string[] | undefined, fieldName: string): string {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (typeof normalized !== 'string' || !normalized.trim()) {
    throw new AIHttpError(400, `${fieldName} is required.`);
  }
  return normalized.trim();
}

async function resolveCategory(userId: Types.ObjectId, categoryIdValue: unknown) {
  const rawCategoryId = Array.isArray(categoryIdValue) ? categoryIdValue[0] : categoryIdValue;
  const categoryId = typeof rawCategoryId === 'string' && rawCategoryId.trim()
    ? rawCategoryId.trim()
    : 'everyday-english';
  const builtIn = DEFAULT_AI_CATEGORIES.find((category) => category.id === categoryId);
  if (builtIn) return { id: builtIn.id, name: builtIn.name };

  if (!Types.ObjectId.isValid(categoryId)) {
    throw new AIHttpError(400, 'categoryId is invalid or does not exist.');
  }
  const custom = await StudentAICategory.findOne({ _id: categoryId, userId }).lean();
  if (!custom) throw new AIHttpError(404, 'Learning category was not found.');
  return { id: String(custom._id), name: custom.name };
}

async function getOwnedConversation(userId: Types.ObjectId, conversationIdValue: string | string[] | undefined) {
  const conversationId = requireObjectId(requireRouteParam(conversationIdValue, 'conversationId'), 'conversationId');
  const conversation = await AIConversation.findOne({ _id: conversationId, userId });
  if (!conversation) throw new AIHttpError(404, 'Conversation was not found.');
  return conversation;
}

export async function getCategories(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const customCategories = await StudentAICategory.find({ userId }).sort({ name: 1 }).lean();
  res.status(200).json({
    success: true,
    data: [
      ...DEFAULT_AI_CATEGORIES.map((category) => ({ ...category, isDefault: true })),
      ...customCategories.map((category) => ({
        id: String(category._id),
        name: category.name,
        description: 'Your personal learning group.',
        isDefault: false,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
    ],
  });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const name = requireString(req.body?.name, 'name', 2, MAX_CATEGORY_NAME_LENGTH);
  const slug = categorySlug(name);

  const existing = await StudentAICategory.findOne({
    userId,
    $or: [
      { slug },
      { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
    ],
  }).lean();
  if (existing) throw new AIHttpError(409, 'You already have a category with this name.');

  const category = await StudentAICategory.create({ userId, name, slug });
  res.status(201).json({
    success: true,
    data: { id: String(category._id), name: category.name, description: 'Your personal learning group.', isDefault: false },
  });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const categoryId = requireRouteParam(req.params.categoryId, 'categoryId');
  if (DEFAULT_AI_CATEGORIES.some((item) => item.id === categoryId)) {
    throw new AIHttpError(400, 'Built-in categories cannot be renamed. Create a personal category instead.');
  }
  const id = requireObjectId(categoryId, 'categoryId');
  const name = requireString(req.body?.name, 'name', 2, MAX_CATEGORY_NAME_LENGTH);
  const slug = categorySlug(name);

  const duplicate = await StudentAICategory.findOne({
    userId,
    _id: { $ne: id },
    $or: [
      { slug },
      { name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
    ],
  }).lean();
  if (duplicate) throw new AIHttpError(409, 'You already have a category with this name.');

  const category = await StudentAICategory.findOneAndUpdate(
    { _id: id, userId },
    { $set: { name, slug } },
   
      { returnDocument: 'after', runValidators: true }, 

  );
  if (!category) throw new AIHttpError(404, 'Learning category was not found.');

  await AIConversation.updateMany({ userId, categoryId: String(id) }, { $set: { categoryName: name } });
  res.status(200).json({ success: true, data: { id: String(category._id), name: category.name, description: 'Your personal learning group.', isDefault: false } });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const categoryId = requireRouteParam(req.params.categoryId, 'categoryId');
  if (DEFAULT_AI_CATEGORIES.some((item) => item.id === categoryId)) {
    throw new AIHttpError(400, 'Built-in categories cannot be deleted.');
  }
  const id = requireObjectId(categoryId, 'categoryId');
  const category = await StudentAICategory.findOne({ _id: id, userId });
  if (!category) throw new AIHttpError(404, 'Learning category was not found.');

  const conversationCount = await AIConversation.countDocuments({ userId, categoryId: String(id) });
  if (conversationCount > 0) {
    throw new AIHttpError(409, 'Move or delete conversations in this category before deleting it.');
  }

  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Learning category deleted.' });
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const category = await resolveCategory(userId, req.body?.categoryId);
  const title = optionalString(req.body?.title, 'title', MAX_CONVERSATION_TITLE_LENGTH) ?? 'New conversation';
  const targetLanguage = optionalString(req.body?.targetLanguage, 'targetLanguage', 40) ?? DEFAULT_TARGET_LANGUAGE;
  const nativeLanguage = optionalString(req.body?.nativeLanguage, 'nativeLanguage', 40) ?? null;

  const conversation = await AIConversation.create({
    userId,
    categoryId: category.id,
    categoryName: category.name,
    title,
    targetLanguage,
    nativeLanguage,
  });

  res.status(201).json({ success: true, data: conversation });
}

export async function listConversations(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const { page, limit, skip } = parsePagination(req.query);
  const filter: { userId: Types.ObjectId; categoryId?: string } = { userId };
  if (typeof req.query.categoryId === 'string' && req.query.categoryId.trim()) {
    const category = await resolveCategory(userId, req.query.categoryId.trim());
    filter.categoryId = category.id;
  }

  const [conversations, total] = await Promise.all([
    AIConversation.find(filter).sort({ lastMessageAt: -1, updatedAt: -1 }).skip(skip).limit(limit).lean(),
    AIConversation.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    data: conversations,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function updateConversation(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const conversation = await getOwnedConversation(userId, req.params.conversationId);
  let changed = false;

  if (req.body?.title !== undefined) {
    conversation.title = requireString(req.body.title, 'title', 1, MAX_CONVERSATION_TITLE_LENGTH);
    changed = true;
  }
  if (req.body?.categoryId !== undefined) {
    const category = await resolveCategory(userId, req.body.categoryId);
    conversation.categoryId = category.id;
    conversation.categoryName = category.name;
    changed = true;
  }
  if (!changed) throw new AIHttpError(400, 'Provide title or categoryId to update.');

  await conversation.save();
  res.status(200).json({ success: true, data: conversation });
}

export async function deleteConversation(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const conversation = await getOwnedConversation(userId, req.params.conversationId);
  await Promise.all([
    AIMessage.deleteMany({ conversationId: conversation._id, userId }),
    AIConversation.deleteOne({ _id: conversation._id, userId }),
  ]);
  res.status(200).json({ success: true, message: 'Conversation and its messages were deleted.' });
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const conversation = await getOwnedConversation(userId, req.params.conversationId);
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { userId, conversationId: conversation._id };
  const [messages, total] = await Promise.all([
    AIMessage.find(filter).sort({ createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    AIMessage.countDocuments(filter),
  ]);
  res.status(200).json({
    success: true,
    conversation: {
      id: String(conversation._id),
      title: conversation.title,
      categoryId: conversation.categoryId,
      categoryName: conversation.categoryName,
      targetLanguage: conversation.targetLanguage,
    },
    data: messages,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function sendChatMessage(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const conversation = await getOwnedConversation(userId, req.params.conversationId);
  const content = requireString(req.body?.content, 'content', 1, MAX_CHAT_MESSAGE_LENGTH);
  // Required idempotency key: Flutter must reuse it when retrying the same send.
  const clientMessageId = requireString(req.body?.clientMessageId, 'clientMessageId', 1, 100);

  let userMessage;
  try {
    userMessage = await AIMessage.findOneAndUpdate(
      { conversationId: conversation._id, userId, clientMessageId },
      {
        $setOnInsert: {
          conversationId: conversation._id,
          userId,
          role: 'user',
          content,
          status: 'pending',
          clientMessageId,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );
  } catch (error) {
    // Handles simultaneous duplicate requests racing against the unique idempotency index.
    if ((error as { code?: number })?.code !== 11000) throw error;
    userMessage = await AIMessage.findOne({ conversationId: conversation._id, userId, clientMessageId });
  }
  if (!userMessage) throw new AIHttpError(500, 'Could not persist your message.');
  if (userMessage.content !== content) {
    throw new AIHttpError(409, 'clientMessageId was already used for a different message.');
  }

  const existingReply = await AIMessage.findOne({
    conversationId: conversation._id,
    userId,
    role: 'assistant',
    replyToMessageId: userMessage._id,
  }).lean();
  if (existingReply) {
    res.status(200).json({
      success: true,
      data: {
        userMessage,
        assistantMessage: existingReply,
        vocabularyToSave: existingReply.vocabularyCandidates ?? [],
      },
    });
    return;
  }

  await AIMessage.updateOne({ _id: userMessage._id, userId }, { $set: { status: 'pending' } });
  try {
    const context = await AIMessage.find({ conversationId: conversation._id, userId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .select({ role: 1, content: 1 })
      .lean();

    const tutorInput = {
      history: context.reverse().map((message) => ({
        role: message.role as 'user' | 'assistant',
        content: message.content,
      })),
      categoryName: conversation.categoryName,
      targetLanguage: conversation.targetLanguage,
      ...(conversation.nativeLanguage != null ? { nativeLanguage: conversation.nativeLanguage } : {}),
    };

    const tutorResult = await generateTutorReply(tutorInput);

    let assistantMessage;
    try {
      assistantMessage = await AIMessage.create({
        userId,
        conversationId: conversation._id,
        role: 'assistant',
        content: tutorResult.reply,
        status: 'complete',
        replyToMessageId: userMessage._id,
        vocabularyCandidates: tutorResult.vocabularyToSave,
      });
    } catch (createError) {
      // A concurrent retry may have completed the same message while this request was generating.
      if ((createError as { code?: number })?.code !== 11000) throw createError;
      const winningReply = await AIMessage.findOne({
        conversationId: conversation._id,
        userId,
        role: 'assistant',
        replyToMessageId: userMessage._id,
      }).lean();
      if (!winningReply) throw createError;
      const persistedUserMessage = await AIMessage.findById(userMessage._id).lean();
      res.status(200).json({
        success: true,
        data: {
          userMessage: persistedUserMessage ?? userMessage,
          assistantMessage: winningReply,
          vocabularyToSave: winningReply.vocabularyCandidates ?? [],
        },
      });
      return;
    }
    userMessage.status = 'complete';
    await userMessage.save();

    const shouldSetTitle = conversation.title === 'New conversation';
    const generatedTitle = content.replace(/\s+/g, ' ').trim().slice(0, 56);
    await AIConversation.updateOne(
      { _id: conversation._id, userId },
      {
        $set: {
          lastMessageAt: assistantMessage.createdAt,
          lastMessagePreview: tutorResult.reply.slice(0, 180),
          ...(shouldSetTitle && generatedTitle ? { title: generatedTitle } : {}),
        },
      },
    );

    res.status(201).json({
      success: true,
      data: {
        userMessage,
        assistantMessage,
        vocabularyToSave: tutorResult.vocabularyToSave,
      },
    });
  } catch (error) {
    await AIMessage.updateOne({ _id: userMessage._id, userId }, { $set: { status: 'failed' } });
    throw error;
  }
}

export async function createIllustration(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  const word = requireString(req.body?.word, 'word', 1, 120);
  const translation = requireString(req.body?.translation, 'translation', 1, 500);
  const exampleSentence = optionalString(req.body?.exampleSentence, 'exampleSentence', 1000);
  let conversationId: Types.ObjectId | null = null;

  if (req.body?.conversationId !== undefined && req.body?.conversationId !== null && req.body?.conversationId !== '') {
    const conversation = await getOwnedConversation(userId, String(req.body.conversationId));
    conversationId = conversation._id;
  }

  const cacheKey = makeIllustrationCacheKey(word, translation);
  const cached = await AIIllustration.findOne({ userId, cacheKey }).lean();
  if (cached) {
    res.status(200).json({ success: true, cached: true, data: { word: cached.word, translation: cached.translation, imageUrl: cached.imageUrl } });
    return;
  }

  const generated = await generateAndStoreIllustration({
    word,
    translation,
    ...(exampleSentence !== undefined ? { exampleSentence } : {}),
  });
  let illustration;
  try {
    illustration = await AIIllustration.create({
      userId,
      conversationId,
      word,
      translation,
      cacheKey,
      publicId: generated.publicId,
      imageUrl: generated.imageUrl,
    });
  } catch (error) {
    // If another request generated the same image simultaneously, reuse the winner's record.
    if ((error as { code?: number })?.code === 11000) {
      illustration = await AIIllustration.findOne({ userId, cacheKey });
    } else {
      throw error;
    }
  }
  if (!illustration) throw new AIHttpError(500, 'The illustration was generated but could not be saved.');

  res.status(201).json({
    success: true,
    cached: false,
    data: { word: illustration.word, translation: illustration.translation, imageUrl: illustration.imageUrl },
  });
}
