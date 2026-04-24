import { z } from 'zod';

export const createChatSchema = z.object({
  body: z.object({
    participantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const getChatSchema = z.object({
  params: z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat ID'),
  }),
});

export const getChatsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional(),
    page: z.string().regex(/^\d+$/).optional(),
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

