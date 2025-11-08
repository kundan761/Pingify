import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (date) => {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
};

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

// Utility function for consistent ID comparison
export const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  const str1 = typeof id1 === 'object' && id1._id ? id1._id.toString() : id1.toString();
  const str2 = typeof id2 === 'object' && id2._id ? id2._id.toString() : id2.toString();
  return str1 === str2;
};

// Get ID as string from object or string
export const getIdString = (id) => {
  if (!id) return null;
  if (typeof id === 'object' && id._id) return id._id.toString();
  return id.toString();
};

// Get other participant from chat (for private chats)
export const getOtherParticipantFromChat = (chat, currentUserId) => {
  if (!chat) return null;
  if (chat.chatType === 'group') {
    return { username: chat.name || 'Group', avatar: chat.avatar };
  }
  const userId = getIdString(currentUserId);
  const other = chat.participants?.find((p) => {
    const participantId = getIdString(p?._id || p);
    return participantId !== userId;
  });
  return other || { username: 'Unknown', avatar: '' };
};

