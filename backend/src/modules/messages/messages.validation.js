import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat ID'),
    content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
    messageType: z.enum(['text', 'image', 'video', 'file', 'audio']).optional(),
    replyTo: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID').optional(),
  }),
});

export const editMessageSchema = z.object({
  params: z.object({
    messageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID'),
  }),
  body: z.object({
    content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  }),
});

export const deleteMessageSchema = z.object({
  params: z.object({
    messageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID'),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat ID'),
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    before: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  }),
});

export const reactToMessageSchema = z.object({
  params: z.object({
    messageId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID'),
  }),
  body: z.object({
    emoji: z.string().min(1, 'Emoji is required'),
  }),
});

export const markAsReadSchema = z.object({
  params: z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat ID'),
  }),
});

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

