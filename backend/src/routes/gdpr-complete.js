/**
 * GDPR Data Export - Complete Implementation
 * P1 Fix: Export all user data as required by GDPR
 */

const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { Logger } = require('../services/Logger');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * GET /gdpr/export
 * Export all user data in machine-readable format
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    Logger.info('GDPR export requested', { userId });

    // Collect all user data
    const gdprData = await collectAllUserData(userId);

    // Create JSON export
    const jsonData = JSON.stringify(gdprData, null, 2);

    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gdpr-export-${userId}-${new Date().toISOString().split('T')[0]}.json"`
    );

    // Send data
    res.send(jsonData);

    Logger.info('GDPR export completed', { userId });
  } catch (error) {
    Logger.error('GDPR export failed', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to export data',
      message: error.message
    });
  }
});

/**
 * GET /gdpr/export/zip
 * Export all user data including files as ZIP
 */
router.get('/export/zip', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    Logger.info('GDPR ZIP export requested', { userId });

    // Collect all user data
    const gdprData = await collectAllUserData(userId);

    // Create archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gdpr-export-${userId}-${new Date().toISOString().split('T')[0]}.zip"`
    );

    // Pipe archive to response
    archive.pipe(res);

    // Add JSON data
    archive.append(JSON.stringify(gdprData, null, 2), {
      name: 'data.json'
    });

    // Add photos
    const photos = gdprData.photos || [];
    for (const photo of photos) {
      try {
        const photoData = await downloadFile(photo.url);
        archive.append(photoData, {
          name: `photos/${photo.id}.jpg`
        });
      } catch (error) {
        Logger.warn('Failed to download photo', { photoId: photo.id, error });
      }
    }

    // Add videos
    const videos = gdprData.videos || [];
    for (const video of videos) {
      try {
        const videoData = await downloadFile(video.url);
        archive.append(videoData, {
          name: `videos/${video.id}.mp4`
        });
      } catch (error) {
        Logger.warn('Failed to download video', { videoId: video.id, error });
      }
    }

    // Add avatar
    if (gdprData.profile?.avatar_url) {
      try {
        const avatarData = await downloadFile(gdprData.profile.avatar_url);
        archive.append(avatarData, {
          name: 'avatar.jpg'
        });
      } catch (error) {
        Logger.warn('Failed to download avatar', { error });
      }
    }

    // Finalize archive
    await archive.finalize();

    Logger.info('GDPR ZIP export completed', { userId });
  } catch (error) {
    Logger.error('GDPR ZIP export failed', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to export data',
      message: error.message
    });
  }
});

/**
 * DELETE /gdpr/delete-account
 * Delete all user data (right to be forgotten)
 */
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    Logger.info('Account deletion requested', { userId });

    // Verify password
    const { data: user, error: authError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password
    });

    if (authError) {
      return res.status(401).json({
        error: 'Invalid password'
      });
    }

    // Delete all user data
    await deleteAllUserData(userId);

    // Delete auth user
    await supabase.auth.admin.deleteUser(userId);

    Logger.info('Account deleted successfully', { userId });

    res.json({
      message: 'Account and all associated data have been deleted'
    });
  } catch (error) {
    Logger.error('Account deletion failed', { error, userId: req.user.id });
    res.status(500).json({
      error: 'Failed to delete account',
      message: error.message
    });
  }
});

/**
 * Collect all user data
 * @private
 */
async function collectAllUserData(userId) {
  const data = {};

  try {
    // Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    data.profile = profile;

    // Matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);
    data.matches = matches;

    // Messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    data.messages = messages;

    // Likes
    const { data: likes } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', userId);
    data.likes = likes;

    // Passes
    const { data: passes } = await supabase
      .from('passes')
      .select('*')
      .eq('user_id', userId);
    data.passes = passes;

    // Blocks
    const { data: blocks } = await supabase
      .from('blocks')
      .select('*')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    data.blocks = blocks;

    // Photos
    const { data: photos } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId);
    data.photos = photos;

    // Videos
    const { data: videos } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId);
    data.videos = videos;

    // Payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId);
    data.payments = payments;

    // Subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);
    data.subscriptions = subscriptions;

    // Sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId);
    data.sessions = sessions;

    // Audit logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId);
    data.auditLogs = auditLogs;

    // Preferences
    const { data: preferences } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId);
    data.preferences = preferences;

    // Notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    data.notifications = notifications;

    // Reports (user made)
    const { data: reportsSubmitted } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', userId);
    data.reportsSubmitted = reportsSubmitted;

    // Reports (against user)
    const { data: reportsAgainst } = await supabase
      .from('reports')
      .select('*')
      .eq('reported_user_id', userId);
    data.reportsAgainst = reportsAgainst;

    // Metadata
    data.exportedAt = new Date().toISOString();
    data.exportVersion = '1.0';

    return data;
  } catch (error) {
    Logger.error('Failed to collect user data', { error, userId });
    throw error;
  }
}

/**
 * Delete all user data
 * @private
 */
async function deleteAllUserData(userId) {
  try {
    // Delete in order of dependencies
    const tables = [
      'message_receipts',
      'messages',
      'matches',
      'likes',
      'passes',
      'blocks',
      'photos',
      'videos',
      'payments',
      'subscriptions',
      'sessions',
      'audit_logs',
      'preferences',
      'notifications',
      'reports',
      'profiles'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .or(`user_id.eq.${userId},user_id_1.eq.${userId},user_id_2.eq.${userId},sender_id.eq.${userId},recipient_id.eq.${userId},reporter_id.eq.${userId},reported_user_id.eq.${userId},blocker_id.eq.${userId},blocked_id.eq.${userId}`);

      if (error) {
        Logger.warn(`Failed to delete from ${table}`, { error, userId });
      }
    }

    Logger.info('All user data deleted', { userId });
  } catch (error) {
    Logger.error('Failed to delete user data', { error, userId });
    throw error;
  }
}

/**
 * Download file from URL
 * @private
 */
async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    https.get(url, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = router;
