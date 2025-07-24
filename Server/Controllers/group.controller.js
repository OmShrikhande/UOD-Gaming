import Group from '../Models/group.model.js';
import User from '../Models/auth.model.js';
import { Message } from '../Models/chat.model.js';
import { validationResult } from 'express-validator';

// Create new group
export const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { name, description, type = 'public', avatar, tags } = req.body;

    // Check if user is a supporter (required to create groups)
    const user = await User.findById(userId);
    if (user.role !== 'supporter' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only supporters can create groups. Please upgrade to supporter first."
      });
    }

    // Check if group name already exists
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(409).json({
        success: false,
        message: "A group with this name already exists"
      });
    }

    // Create default channels
    const defaultCategories = [{
      name: 'General',
      description: 'General discussion channels',
      channels: [
        {
          name: 'general',
          type: 'text',
          description: 'General chat for all members'
        },
        {
          name: 'announcements',
          type: 'announcement',
          description: 'Important announcements'
        }
      ]
    }];

    // Create new group
    const group = new Group({
      name,
      description,
      avatar,
      type,
      creator: userId,
      members: [{
        user: userId,
        role: 'admin',
        joinedAt: new Date(),
        permissions: {
          canInvite: true,
          canKick: true,
          canManageMessages: true,
          canManageEvents: true
        }
      }],
      categories: defaultCategories,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      statistics: {
        totalMembers: 1,
        lastActivity: new Date()
      }
    });

    await group.save();

    // Add group to user's groups list
    user.groups.push(group._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully!",
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        type: group.type,
        memberCount: 1,
        createdAt: group.createdAt
      }
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create group"
    });
  }
};

// Get all groups with filters
export const getAllGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      type,
      search,
      sortBy = 'members',
      tags
    } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case 'members':
        sortCriteria = { 'statistics.totalMembers': -1 };
        break;
      case 'activity':
        sortCriteria = { 'statistics.lastActivity': -1 };
        break;
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'name':
        sortCriteria = { name: 1 };
        break;
      default:
        sortCriteria = { 'statistics.totalMembers': -1 };
        break;
    }

    const groups = await Group.find(query)
      .populate('creator', 'username profile.displayName profile.avatar')
      .populate('members.user', 'username profile.displayName profile.avatar')
      .sort(sortCriteria)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Group.countDocuments(query);

    // Get popular tags
    const popularTags = await Group.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.status(200).json({
      success: true,
      groups,
      popularTags,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch groups"
    });
  }
};

// Get single group details
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?._id;

    const group = await Group.findById(groupId)
      .populate('creator', 'username profile.displayName profile.avatar')
      .populate('members.user', 'username profile.displayName profile.avatar gameStats.level')
      .populate('bannedMembers.user', 'username profile.displayName')
      .populate('bannedMembers.bannedBy', 'username');

    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check if user can view this group
    const isMember = userId && group.members.some(member => 
      member.user._id.toString() === userId.toString()
    );

    if (group.type === 'private' && !isMember) {
      return res.status(403).json({
        success: false,
        message: "This is a private group"
      });
    }

    // Get recent messages from general channel
    let recentMessages = [];
    const generalChannel = group.categories[0]?.channels[0];
    if (generalChannel && isMember) {
      recentMessages = await Message.find({ group: groupId })
        .populate('sender', 'username profile.displayName profile.avatar')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.status(200).json({
      success: true,
      group,
      recentMessages,
      isMember,
      userRole: isMember ? group.members.find(m => 
        m.user._id.toString() === userId.toString()
      ).role : null
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group details"
    });
  }
};

// Join group
export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => 
      member.user.toString() === userId.toString()
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group"
      });
    }

    // Check if user is banned
    const isBanned = group.bannedMembers.some(banned => 
      banned.user.toString() === userId.toString() &&
      (!banned.banExpiresAt || banned.banExpiresAt > new Date())
    );

    if (isBanned) {
      return res.status(403).json({
        success: false,
        message: "You are banned from this group"
      });
    }

    // Check group type and membership limits
    if (group.type === 'private') {
      return res.status(403).json({
        success: false,
        message: "This is a private group. You need an invitation to join."
      });
    }

    if (group.members.length >= group.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "This group is full"
      });
    }

    // Add user to group
    group.members.push({
      user: userId,
      role: 'member',
      joinedAt: new Date()
    });

    group.statistics.totalMembers += 1;
    group.statistics.lastActivity = new Date();
    await group.save();

    // Add group to user's groups list
    const user = await User.findById(userId);
    user.groups.push(groupId);
    await user.save();

    // Send welcome message if enabled
    if (group.settings.welcomeMessage) {
      const welcomeMessage = new Message({
        sender: group.creator,
        group: groupId,
        content: group.settings.welcomeMessage.replace('{username}', user.username),
        type: 'system',
        metadata: {
          systemMessage: {
            action: 'user_joined',
            targetUser: userId
          }
        }
      });
      await welcomeMessage.save();
    }

    res.status(200).json({
      success: true,
      message: `Successfully joined ${group.name}!`,
      group: {
        id: group._id,
        name: group.name,
        memberCount: group.statistics.totalMembers
      }
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to join group"
    });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(member => 
      member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group"
      });
    }

    // Check if user is the creator
    if (group.creator.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Group creator cannot leave. Transfer ownership or delete the group."
      });
    }

    // Remove user from group
    group.members.splice(memberIndex, 1);
    group.statistics.totalMembers -= 1;
    group.statistics.lastActivity = new Date();
    await group.save();

    // Remove group from user's groups list
    const user = await User.findById(userId);
    user.groups = user.groups.filter(gId => gId.toString() !== groupId.toString());
    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully left ${group.name}`
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to leave group"
    });
  }
};

// Get user's groups
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(userId).populate({
      path: 'groups',
      populate: {
        path: 'creator members.user',
        select: 'username profile.displayName profile.avatar'
      },
      options: {
        sort: { 'statistics.lastActivity': -1 },
        limit: limit * 1,
        skip: (page - 1) * limit
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const total = user.groups.length;

    res.status(200).json({
      success: true,
      groups: user.groups,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your groups"
    });
  }
};

// Update group (Admin/Moderator only)
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check if user has permission to update
    const member = group.members.find(m => m.user.toString() === userId.toString());
    if (!member || (member.role !== 'admin' && member.role !== 'moderator')) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this group"
      });
    }

    // Remove sensitive fields from updates
    delete updates.creator;
    delete updates.members;
    delete updates.statistics;

    Object.assign(group, updates);
    group.updatedAt = new Date();
    await group.save();

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      group
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update group"
    });
  }
};

// Delete group (Creator only)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Check if user is the creator
    if (group.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the group creator can delete the group"
      });
    }

    // Remove group from all members' groups list
    await User.updateMany(
      { groups: groupId },
      { $pull: { groups: groupId } }
    );

    // Delete all messages in this group
    await Message.deleteMany({ group: groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({
      success: true,
      message: "Group deleted successfully"
    });

  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete group"
    });
  }
};