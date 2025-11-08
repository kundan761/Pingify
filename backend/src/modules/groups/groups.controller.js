import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as groupsService from './groups.service.js';

export const createGroup = asyncHandler(async (req, res) => {
  const group = await groupsService.createGroup(req.user.userId, req.body, req.file);

  res.status(201).json({
    success: true,
    message: 'Group created successfully',
    data: group,
  });
});

export const getGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const group = await groupsService.getGroup(groupId, req.user.userId);

  res.json({
    success: true,
    data: group,
  });
});

export const updateGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const group = await groupsService.updateGroup(groupId, req.user.userId, req.body, req.file);

  res.json({
    success: true,
    message: 'Group updated successfully',
    data: group,
  });
});

export const addMembers = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { memberIds } = req.body;
  const group = await groupsService.addMembers(groupId, req.user.userId, memberIds);

  res.json({
    success: true,
    message: 'Members added successfully',
    data: group,
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const group = await groupsService.removeMember(groupId, req.user.userId, userId);

  res.json({
    success: true,
    message: 'Member removed successfully',
    data: group,
  });
});

export const promoteToModerator = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const group = await groupsService.promoteToModerator(groupId, req.user.userId, userId);

  res.json({
    success: true,
    message: 'User promoted to moderator',
    data: group,
  });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const group = await groupsService.leaveGroup(groupId, req.user.userId);

  res.json({
    success: true,
    message: 'Left group successfully',
    data: group,
  });
});

export const getMyGroups = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const result = await groupsService.getMyGroups(req.user.userId, parseInt(limit), parseInt(page));

  res.json({
    success: true,
    data: result,
  });
});

