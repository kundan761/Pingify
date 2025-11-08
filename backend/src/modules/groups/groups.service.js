import Group from './groups.model.js';
import Chat from '../chats/chats.model.js';
import User from '../auth/auth.model.js';
import logger from '../../config/logger.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.js';
import AppError from '../../utils/AppError.js';

export const createGroup = async (adminId, groupData, avatarFile = null) => {
  const { name, description, memberIds = [] } = groupData;

  const allMemberIds = [...new Set([adminId, ...memberIds])];
  const members = await User.find({ _id: { $in: allMemberIds } });

  if (members.length !== allMemberIds.length) {
    throw new AppError('Some users not found', 404);
  }

  const chat = new Chat({
    participants: allMemberIds,
    chatType: 'group',
  });
  await chat.save();

  let avatar = '';
  if (avatarFile) {
    const uploadResult = await uploadToCloudinary(avatarFile, 'pingify/groups');
    avatar = uploadResult.url;
  }

  const group = new Group({
    name,
    description,
    avatar,
    admin: adminId,
    members: allMemberIds,
    chat: chat._id,
  });

  await group.save();
  await group.populate('admin', 'username email avatar');
  await group.populate('members', 'username email avatar');
  await group.populate('moderators', 'username email avatar');

  logger.info(`Group created: ${group._id} by admin: ${adminId}`);

  return group;
};

export const getGroup = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  if (!group.members.includes(userId)) {
    throw new AppError('You are not a member of this group', 403);
  }

  await group.populate('admin', 'username email avatar');
  await group.populate('members', 'username email avatar');
  await group.populate('moderators', 'username email avatar');
  await group.populate('chat');

  return group;
};

export const updateGroup = async (groupId, userId, updateData, avatarFile = null) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  if (group.admin.toString() !== userId && !group.moderators.includes(userId)) {
    throw new AppError('Only admins and moderators can update group', 403);
  }

  if (updateData.name) {
    group.name = updateData.name;
  }

  if (updateData.description !== undefined) {
    group.description = updateData.description;
  }

  if (updateData.settings) {
    group.settings = { ...group.settings, ...updateData.settings };
  }

  if (avatarFile) {
    if (group.avatar && group.avatar.includes('cloudinary')) {
      const publicId = group.avatar.split('/').slice(-2).join('/').split('.')[0];
      await deleteFromCloudinary(publicId);
    }

    const uploadResult = await uploadToCloudinary(avatarFile, 'pingify/groups');
    group.avatar = uploadResult.url;
  }

  await group.save();
  await group.populate('admin', 'username email avatar');
  await group.populate('members', 'username email avatar');

  logger.info(`Group updated: ${groupId}`);

  return group;
};

export const addMembers = async (groupId, userId, memberIds) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  if (group.admin.toString() !== userId && !group.moderators.includes(userId)) {
    throw new AppError('Only admins and moderators can add members', 403);
  }

  const newMembers = await User.find({ _id: { $in: memberIds } });
  if (newMembers.length !== memberIds.length) {
    throw new AppError('Some users not found', 404);
  }

  const existingMemberIds = group.members.map((m) => m.toString());
  const uniqueNewMembers = memberIds.filter((id) => !existingMemberIds.includes(id));

  group.members.push(...uniqueNewMembers);

  const chat = await Chat.findById(group.chat);
  chat.participants.push(...uniqueNewMembers);
  await chat.save();

  await group.save();
  await group.populate('members', 'username email avatar');

  logger.info(`Members added to group: ${groupId}`);

  return group;
};

export const removeMember = async (groupId, userId, targetUserId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  if (group.admin.toString() === targetUserId) {
    throw new AppError('Cannot remove group admin', 400);
  }

  if (group.admin.toString() !== userId && !group.moderators.includes(userId)) {
    if (userId !== targetUserId) {
      throw new AppError('Only admins and moderators can remove members', 403);
    }
  }

  group.members = group.members.filter((m) => m.toString() !== targetUserId);
  group.moderators = group.moderators.filter((m) => m.toString() !== targetUserId);

  const chat = await Chat.findById(group.chat);
  chat.participants = chat.participants.filter((p) => p.toString() !== targetUserId);
  await chat.save();

  await group.save();

  logger.info(`Member removed from group: ${groupId}`);

  return group;
};

export const promoteToModerator = async (groupId, userId, targetUserId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  if (group.admin.toString() !== userId) {
    throw new AppError('Only admin can promote moderators', 403);
  }

  if (!group.members.includes(targetUserId)) {
    throw new AppError('User is not a member of this group', 400);
  }

  if (!group.moderators.includes(targetUserId)) {
    group.moderators.push(targetUserId);
    await group.save();
  }

  await group.populate('moderators', 'username email avatar');

  logger.info(`User promoted to moderator in group: ${groupId}`);

  return group;
};

export const leaveGroup = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  if (group.admin.toString() === userId) {
    throw new AppError('Admin cannot leave group. Transfer admin or delete group', 400);
  }

  group.members = group.members.filter((m) => m.toString() !== userId);
  group.moderators = group.moderators.filter((m) => m.toString() !== userId);

  const chat = await Chat.findById(group.chat);
  chat.participants = chat.participants.filter((p) => p.toString() !== userId);
  await chat.save();

  await group.save();

  logger.info(`User left group: ${groupId}`);

  return group;
};

export const getMyGroups = async (userId, limit = 50, page = 1) => {
  const skip = (page - 1) * limit;

  const groups = await Group.find({
    members: userId,
  })
    .populate('admin', 'username email avatar')
    .populate('members', 'username email avatar')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Group.countDocuments({
    members: userId,
  });

  return {
    groups,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

