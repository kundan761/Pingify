import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    status: z.string().max(100, 'Status must be at most 100 characters').optional(),
    privacy: z
      .object({
        showLastSeen: z.boolean().optional(),
        showOnlineStatus: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const blockUserSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
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

