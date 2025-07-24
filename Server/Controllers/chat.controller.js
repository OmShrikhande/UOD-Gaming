import { Message, Conversation } from '../Models/chat.model.js';
import Group from '../Models/group.model.js';
import User from '../Models/auth.model.js';
import { validationResult } from 'express-validator';

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { groupId } = req.params;
    const { content, type = 'text', replyTo } = req.body;
    const userId = req.user._id;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    const isMember = group.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group"
      });
    }

    // Process attachments if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/chat/${file.filename}`
      }));
    }

    // Create message
    const message = new Message({
      sender: userId,
      group: groupId,
      content,
      type,
      attachments,
      replyTo: replyTo || null
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'username profile.displayName profile.avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update group's last activity
    group.statistics.lastActivity = new Date();
    group.statistics.totalMessages += 1;
    await group.save();

    // Emit to socket.io for real-time updates
    req.io?.to(`group_${groupId}`).emit('new_message', message);

    res.status(201).json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
};

// Send direct message
export const sendDirectMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const { recipientId } = req.params;
    const { content, type = 'text', replyTo } = req.body;
    const userId = req.user._id;

    if (userId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send message to yourself"
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found"
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, recipientId],
        unreadCounts: [
          { user: userId, count: 0 },
          { user: recipientId, count: 0 }
        ]
      });
      await conversation.save();
    }

    // Process attachments if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/chat/${file.filename}`
      }));
    }

    // Create message
    const message = new Message({
      sender: userId,
      recipient: recipientId,
      content,
      type,
      attachments,
      replyTo: replyTo || null
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    
    // Increment unread count for recipient
    const recipientUnread = conversation.unreadCounts.find(
      uc => uc.user.toString() === recipientId
    );
    if (recipientUnread) {
      recipientUnread.count += 1;
    }

    await conversation.save();

    // Populate message
    await message.populate('sender', 'username profile.displayName profile.avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Emit to socket.io for real-time updates
    req.io?.to(`user_${recipientId}`).emit('new_direct_message', message);
    req.io?.to(`user_${userId}`).emit('message_sent', message);

    res.status(201).json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user._id;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    const isMember = group.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group"
      });
    }

    // Build query
    let query = { group: groupId, isDeleted: false };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username profile.displayName profile.avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ group: groupId, isDeleted: false });

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
};

// Get direct messages
export const getDirectMessages = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const userId = req.user._id;

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    });

    if (!conversation) {
      return res.status(200).json({
        success: true,
        messages: [],
        pagination: { current: 1, pages: 0, total: 0 }
      });
    }

    // Build query
    let query = {
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ],
      isDeleted: false
    };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username profile.displayName profile.avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ],
      isDeleted: false
    });

    // Mark messages as read
    const unreadCount = conversation.unreadCounts.find(
      uc => uc.user.toString() === userId.toString()
    );
    if (unreadCount && unreadCount.count > 0) {
      unreadCount.count = 0;
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get direct messages error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
};

// Get user's conversations
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      participants: userId,
      isArchived: false
    })
    .populate('participants', 'username profile.displayName profile.avatar settings.showOnlineStatus')
    .populate('lastMessage')
    .sort({ lastActivity: -1 })
    .limit(parseInt(limit))
    .skip((page - 1) * limit);

    const total = await Conversation.countDocuments({
      participants: userId,
      isArchived: false
    });

    // Format conversations with unread counts and other user info
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
      const unreadCount = conv.unreadCounts.find(uc => uc.user.toString() === userId.toString());
      
      return {
        id: conv._id,
        otherUser: {
          id: otherUser._id,
          username: otherUser.username,
          displayName: otherUser.profile?.displayName,
          avatar: otherUser.profile?.avatar,
          isOnline: otherUser.settings?.showOnlineStatus // This would be updated by socket.io
        },
        lastMessage: conv.lastMessage,
        lastActivity: conv.lastActivity,
        unreadCount: unreadCount?.count || 0
      };
    });

    res.status(200).json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Check if user is the sender or has permission to delete
    if (message.sender.toString() !== userId.toString()) {
      // Check if it's a group message and user is admin/moderator
      if (message.group) {
        const group = await Group.findById(message.group);
        const member = group.members.find(m => m.user.toString() === userId.toString());
        
        if (!member || (member.role !== 'admin' && member.role !== 'moderator')) {
          return res.status(403).json({
            success: false,
            message: "You don't have permission to delete this message"
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own messages"
        });
      }
    }

    // Mark message as deleted
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Emit to socket.io for real-time updates
    if (message.group) {
      req.io?.to(`group_${message.group}`).emit('message_deleted', messageId);
    } else {
      req.io?.to(`user_${message.recipient}`).emit('message_deleted', messageId);
      req.io?.to(`user_${message.sender}`).emit('message_deleted', messageId);
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message"
    });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty"
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // Check if message is older than 24 hours
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > 24 * 60 * 60 * 1000) { // 24 hours
      return res.status(400).json({
        success: false,
        message: "Cannot edit messages older than 24 hours"
      });
    }

    // Update message
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'username profile.displayName profile.avatar');

    // Emit to socket.io for real-time updates
    if (message.group) {
      req.io?.to(`group_${message.group}`).emit('message_edited', message);
    } else {
      req.io?.to(`user_${message.recipient}`).emit('message_edited', message);
      req.io?.to(`user_${message.sender}`).emit('message_edited', message);
    }

    res.status(200).json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to edit message"
    });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: "Emoji is required"
      });
    }

    const message = await Message.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Find or create reaction
    let reaction = message.reactions.find(r => r.emoji === emoji);
    
    if (reaction) {
      // Check if user already reacted with this emoji
      if (reaction.users.includes(userId)) {
        // Remove reaction
        reaction.users = reaction.users.filter(uid => uid.toString() !== userId.toString());
        reaction.count = reaction.users.length;
        
        // Remove reaction if no users left
        if (reaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add reaction
        reaction.users.push(userId);
        reaction.count += 1;
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [userId],
        count: 1
      });
    }

    await message.save();

    // Emit to socket.io for real-time updates
    if (message.group) {
      req.io?.to(`group_${message.group}`).emit('reaction_updated', {
        messageId,
        reactions: message.reactions
      });
    } else {
      req.io?.to(`user_${message.recipient}`).emit('reaction_updated', {
        messageId,
        reactions: message.reactions
      });
      req.io?.to(`user_${message.sender}`).emit('reaction_updated', {
        messageId,
        reactions: message.reactions
      });
    }

    res.status(200).json({
      success: true,
      reactions: message.reactions
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to add reaction"
    });
  }
};

// Search messages
export const searchMessages = async (req, res) => {
  try {
    const { query, groupId, recipientId, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    // Build search criteria
    let searchCriteria = {
      $text: { $search: query },
      isDeleted: false
    };

    if (groupId) {
      // Search in specific group
      const group = await Group.findById(groupId);
      const isMember = group.members.some(member => 
        member.user.toString() === userId.toString()
      );
      
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group"
        });
      }
      
      searchCriteria.group = groupId;
    } else if (recipientId) {
      // Search in direct messages with specific user
      searchCriteria.$or = [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ];
    } else {
      // Search in user's accessible messages
      const userGroups = await Group.find({
        'members.user': userId,
        isActive: true
      }).select('_id');
      
      searchCriteria.$or = [
        { group: { $in: userGroups.map(g => g._id) } },
        { sender: userId },
        { recipient: userId }
      ];
    }

    const messages = await Message.find(searchCriteria)
      .populate('sender', 'username profile.displayName profile.avatar')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(searchCriteria);

    res.status(200).json({
      success: true,
      messages,
      query,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to search messages"
    });
  }
};