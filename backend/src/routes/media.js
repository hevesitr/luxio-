const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool, isDatabaseAvailable } = require('../database/pool');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Multer configuration
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Érvénytelen fájltípus. Csak JPG, PNG és MP4 fájlok engedélyezettek.'));
    }
  },
});

/**
 * POST /media/upload
 * Média fájl feltöltése
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, isPrivate } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'Nincs fájl a kérésben.',
        },
      });
    }

    // Validate file size
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB video, 10MB photo
    if (file.size > maxSize) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `Fájl túl nagy. Maximum ${maxSize / 1024 / 1024}MB.`,
        },
      });
    }

    // TODO: Upload to S3 or similar storage
    // TODO: Strip EXIF data
    // TODO: NSFW detection
    // TODO: Virus scanning

    // For now, just return a placeholder URL
    const fileUrl = `https://cdn.example.com/uploads/${userId}/${Date.now()}_${file.originalname}`;
    const thumbnailUrl = type === 'video' ? `https://cdn.example.com/uploads/${userId}/thumb_${Date.now()}_${file.originalname}` : null;

    // Save to database
    const result = await pool.query(
      `INSERT INTO media_files (user_id, url, thumbnail_url, type, size, mime_type, storage_path, virus_scan_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'clean')
       RETURNING id, url, thumbnail_url, type, size`,
      [userId, fileUrl, thumbnailUrl, type, file.size, file.mimetype, file.path]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Szerver hiba történt a feltöltés során.',
      },
    });
  }
});

/**
 * DELETE /media/:mediaId
 * Média fájl törlése
 */
router.delete('/:mediaId', async (req, res) => {
  try {
    const userId = req.user.id;
    const mediaId = req.params.mediaId;

    // Verify ownership
    const mediaResult = await pool.query(
      'SELECT id, storage_path FROM media_files WHERE id = $1 AND user_id = $2',
      [mediaId, userId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEDIA_NOT_FOUND',
          message: 'Média fájl nem található.',
        },
      });
    }

    // TODO: Delete from S3 or similar storage

    // Delete from database
    await pool.query(
      'DELETE FROM media_files WHERE id = $1',
      [mediaId]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Szerver hiba történt.',
      },
    });
  }
});

module.exports = router;

