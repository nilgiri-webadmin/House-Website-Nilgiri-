import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../utils/supabase';
import { requireAdmin, AuthRequest } from '../utils/permissions';
import { Readable } from 'stream';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return requireAdmin()(handlePost)(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  try {
    // Handle file upload
    // Note: Vercel serverless functions have limitations with multipart/form-data
    // For production, consider using a service like Cloudinary or handling uploads client-side

    const { file, fileName, folder, bucket } = req.body;

    if (!file || !fileName) {
      return res.status(400).json({ error: 'File and fileName are required' });
    }

    // Convert base64 to buffer if needed
    let fileBuffer: Buffer;
    if (typeof file === 'string') {
      // Base64 encoded
      fileBuffer = Buffer.from(file, 'base64');
    } else {
      return res.status(400).json({ error: 'Invalid file format. Expected base64 string' });
    }

    const bucketName = bucket || 'nilgiri_media';
    const folderPath = folder || 'Nilgiri Website/Communities';

    // Generate unique filename
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const uniqueFileName = `${uniqueId}${ext}`;

    // Full path for storage
    const filePath = `${folderPath}/${uniqueFileName}`;

    console.log(`📤 Uploading to ${bucketName}/${filePath}`);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: req.headers['content-type'] || 'application/octet-stream',
        cacheControl: '31536000',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Generate public URL directly
    const projectId = process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0];
    if (!projectId) {
      throw new Error('Invalid SUPABASE_URL configuration');
    }
    const publicUrl = `https://${projectId}.supabase.co/storage/v1/object/public/nilgiri_media/${filePath}`;

    console.log(`✅ Upload successful: ${publicUrl}`);

    // Store metadata in media_library (optional, non-critical)
    try {
      const { error: mediaError } = await supabaseAdmin
        .from('media_library')
        .insert({
          file_name: fileName,
          file_path: filePath,
          file_type: req.headers['content-type'] || 'application/octet-stream',
          file_size: fileBuffer.length,
          uploaded_by: req.user?.id || 'admin',
          url: publicUrl
        });

      if (mediaError) {
        console.warn('⚠️ Could not save to media_library:', mediaError);
      }
    } catch (err) {
      console.warn('⚠️ Library insert failed (non-critical):', err);
    }

    return res.status(200).json({
      url: publicUrl,
      filepath: filePath,
      filename: fileName,
      bucket: 'nilgiri_media',
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}