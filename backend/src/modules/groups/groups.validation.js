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

export const deleteGroupSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
  }),
});

export const transferAdminSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
  }),
  body: z.object({
    newAdminId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

export const demoteModeratorSchema = z.object({
  params: z.object({
    groupId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid group ID'),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
});

// Middleware to parse JSON strings from FormData before validation
// This MUST run after multer and before validation
export const parseFormData = (req, res, next) => {
  // After multer processes FormData, all values are strings
  // We need to parse any JSON strings back to their original types
  console.log('=== parseFormData MIDDLEWARE CALLED ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('req.body keys:', Object.keys(req.body));
  console.log('req.body before parsing:', JSON.stringify(req.body, null, 2));
  
  if (!req.body || typeof req.body !== 'object') {
    console.log('WARNING: req.body is not an object, skipping parsing');
    return next();
  }
  
  const parsedBody = {};
  
  // Parse any stringified JSON fields (arrays or objects)
  for (const key in req.body) {
    const value = req.body[key];
    
    if (typeof value === 'string' && value.length > 0) {
      const trimmed = value.trim();
      
      // Check if it looks like JSON (starts with { or [)
      if (trimmed.length >= 2) {
        const firstChar = trimmed[0];
        const lastChar = trimmed[trimmed.length - 1];
        
        if ((firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']')) {
          try {
            const parsed = JSON.parse(value);
            parsedBody[key] = parsed;
            console.log(`✓ Parsed ${key}: string -> ${Array.isArray(parsed) ? `Array(${parsed.length})` : typeof parsed}`);
          } catch (error) {
            // If parsing fails, keep as string
            parsedBody[key] = value;
            console.log(`✗ Failed to parse ${key} (keeping as string):`, error.message);
          }
        } else {
          // Not JSON, keep as string
          parsedBody[key] = value;
        }
      } else {
        // Empty or too short, keep as string
        parsedBody[key] = value;
      }
    } else {
      // Not a string, keep as is
      parsedBody[key] = value;
    }
  }
  
  // Replace req.body with parsed version
  req.body = parsedBody;
  console.log('req.body after parsing:', JSON.stringify(req.body, null, 2));
  console.log('=== parseFormData MIDDLEWARE COMPLETE ===');
  next();
};

export const validate = (schema) => (req, res, next) => {
  try {
    console.log('=== VALIDATION START ===');
    console.log('req.body type:', typeof req.body);
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    
    // Double-check: if memberIds is still a string, try to parse it here as a fallback
    if (req.body && req.body.memberIds && typeof req.body.memberIds === 'string') {
      console.log('WARNING: memberIds is still a string in validation! Attempting to parse...');
      try {
        req.body.memberIds = JSON.parse(req.body.memberIds);
        console.log('✓ Successfully parsed memberIds in validation middleware');
      } catch (e) {
        console.log('✗ Failed to parse memberIds in validation middleware:', e.message);
      }
    }
    
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    console.log('✓ Validation passed');
    console.log('=== VALIDATION END ===');
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('✗ Validation errors:', error.errors);
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

