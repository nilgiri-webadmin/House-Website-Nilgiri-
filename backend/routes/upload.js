// filepath: backend/routes/upload.js
import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { authenticateToken, requireClubAdmin } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .webp, .png, .jpg, and .jpeg images are allowed.'));
    }
  }
});

// Helper to generate public URL directly (no API call needed)
const getPublicUrl = (bucket, filepath) => {
  // Extract project ID from SUPABASE_URL (e.g., https://abcdefgh.supabase.co)
  const projectId = process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0];
  if (!projectId) {
    throw new Error('Invalid SUPABASE_URL configuration');
  }
  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${filepath}`;
};

// POST /api/upload - Upload image to Supabase Storage
router.post('/', authenticateToken, requireClubAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`📤 Upload started by ${req.user.email} (Role: ${req.user.role})`);

    const bucket = req.body.bucket || 'nilgiri_media';
    
    // Build folder path: nilgiri_media/Nilgiri Website/[category]
    let category = req.body.category || req.body.folder || 'Communities';
    
    // Normalize category names - remove leading/trailing spaces but preserve it
    category = category.trim();
    
    // Construct the full folder path (matches existing structure)
    const folder = `Nilgiri Website/${category}`;

    // Generate unique filename (WITHOUT folder in the name)
    const ext = path.extname(req.file.originalname);
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const filename = `${uniqueId}${ext}`;

    // Full path for storage
    const fullPath = `${folder}/${filename}`;

    console.log(`📤 Uploading to ${bucket}/${fullPath}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '31536000', // 1 year
      });

    if (error) {
      throw error;
    }

    // Generate public URL directly (permanent, no token)
    const publicUrl = getPublicUrl(bucket, fullPath);

    console.log(`✅ Upload successful: ${publicUrl}`);

    // Store in media_library table
    try {
      const { error: libraryError } = await supabase
        .from('media_library')
        .insert({
          bucket,
          folder,
          filename,
          filepath: fullPath,
          url: publicUrl,
          mimetype: req.file.mimetype,
          size: req.file.size,
          uploaded_by: req.body.user_id || 'admin',
          uploaded_at: new Date().toISOString()
        });

      if (libraryError) {
        console.warn('⚠️ Could not save to media_library:', libraryError);
        // Still return success - file uploaded even if library entry fails
      }
    } catch (libraryErr) {
      console.warn('⚠️ Library insert failed (non-critical):', libraryErr);
    }

    res.status(200).json({
      url: publicUrl,
      filepath: fullPath,
      filename,
      bucket,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload file'
    });
  }
});

// GET /api/upload/list/:bucket - List all uploaded images from media library
router.get('/list/:bucket', async (req, res) => {
  try {
    const bucket = req.params.bucket || 'nilgiri_media';
    
    // Build folder path to match existing structure
    let category = req.query.category || req.query.folder || 'Communities';
    category = category.trim();
    const folder = `Nilgiri Website/${category}`;

    console.log(`📋 Fetching media library: ${bucket}/${folder}`);

    // Get from media_library table (faster, always accurate)
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .eq('bucket', bucket)
      .eq('folder', folder)
      .order('uploaded_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    // Return formatted response
    const files = (data || []).map(file => ({
      id: file.id,
      name: file.filename,
      url: file.url, // Already stored public URL
      folder: file.folder,
      created_at: file.uploaded_at,
      size: file.size,
      mimetype: file.mimetype,
      filepath: file.filepath
    }));

    console.log(`✅ Found ${files.length} files in library`);

    res.json({
      files,
      bucket,
      folder,
      total: files.length
    });
  } catch (error) {
    console.error('❌ List error:', error);
    res.status(500).json({ error: error.message || 'Failed to list files' });
  }
});

// DELETE /api/upload - Delete uploaded image
router.delete('/', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    const { bucket, filepath, id } = req.body;

    if (!bucket || !filepath) {
      return res.status(400).json({ error: 'bucket and filepath required' });
    }

    console.log(`🗑️ Deleting ${bucket}/${filepath}`);

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([filepath]);

    if (storageError) {
      throw storageError;
    }

    // Delete from media_library table
    if (id) {
      const { error: libraryError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', id);

      if (libraryError) {
        console.warn('⚠️ Could not delete from media_library:', libraryError);
      }
    }

    console.log(`✅ Deleted successfully`);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
});

export default router;
