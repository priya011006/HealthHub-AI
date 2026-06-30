const Notification = require('../models/Notification');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('[Get Notifications Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
};

/**
 * @desc    Mark a specific notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOne({ _id: id, userId: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.json({ success: true, notification });
  } catch (error) {
    console.error('[Mark Notification Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error marking notification as read.' });
  }
};

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('[Mark All Notifications Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating notifications.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
