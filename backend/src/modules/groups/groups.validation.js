import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    memberIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')).optional(),
  }),
});

export const updateGroupSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    settings: z
      .object({
        isPublic: z.boolean().optional(),
        allowInvites: z.boolean().optional(),
        onlyAdminsCanPost: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const addMembersSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
  }),
  body: z.object({
    memberIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID')).min(1),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const promoteToModeratorSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const getGroupSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
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

