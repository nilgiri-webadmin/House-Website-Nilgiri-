import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './utils/supabase';
import { authenticateRequest } from './utils/auth';
import { ALL_ROLES } from './utils/permissions';
import Busboy from 'busboy';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

// Helper to generate public URL directly
const getPublicUrl = (bucket: string, filepath: string) => {
  const projectId = process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0];
  if (!projectId) {
    throw new Error('Invalid SUPABASE_URL configuration');
  }
  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${filepath}`;
};

const parseMultipartRequest = (req: VercelRequest) => {
  return new Promise<{
    fields: Record<string, string>;
    fileBuffer: Buffer;
    filename: string;
    mimetype: string;
  }>((resolve, reject) => {
    const fields: Record<string, string> = {};
    const fileChunks: Buffer[] = [];
    let filename = '';
    let mimetype = '';
    let fileSeen = false;

    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: 5 * 1024 * 1024 },
    });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, file, info) => {
      if (fieldname !== 'file') {
        file.resume();
        return;
      }

      fileSeen = true;
      filename = info.filename || '';
      mimetype = info.mimeType || 'application/octet-stream';

      file.on('data', (data: Buffer) => {
        fileChunks.push(data);
      });

      file.on('limit', () => {
        reject(new Error('File exceeds 5MB limit'));
      });
    });

    busboy.on('error', reject);

    busboy.on('finish', () => {
      if (!fileSeen) {
        reject(new Error('No file provided'));
        return;
      }

      resolve({
        fields,
        fileBuffer: Buffer.concat(fileChunks),
        filename,
        mimetype,
      });
    });

    req.pipe(busboy);
  });
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // POST - Upload file (base64) - requires authentication
    if (req.method === 'POST') {
      const user = await authenticateRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const contentType = String(req.headers['content-type'] || '');
      let bucket = 'nilgiri_media';
      let category = 'Communities';
      let filename = '';
      let mimetype = 'application/octet-stream';
      let buffer: Buffer;

      if (contentType.includes('multipart/form-data')) {
        const parsed = await parseMultipartRequest(req);
        bucket = parsed.fields.bucket || bucket;
        category = parsed.fields.category || parsed.fields.folder || category;
        filename = parsed.filename;
        mimetype = parsed.mimetype;
        buffer = parsed.fileBuffer;
      } else {
        const body = req.body as any;
        const { file, bucket: bodyBucket = bucket, category: bodyCategory, folder, filename: bodyFilename, mimetype: bodyMimeType } = body;

        bucket = bodyBucket;
        category = bodyCategory || folder || category;
        filename = bodyFilename || '';
        mimetype = bodyMimeType || mimetype;

        if (!file || !filename) {
          return res.status(400).json({ error: 'File data and filename required' });
        }

        if (typeof file === 'string' && file.startsWith('data:')) {
          const base64Data = file.split(',')[1];
          buffer = Buffer.from(base64Data, 'base64');
        } else if (typeof file === 'string') {
          buffer = Buffer.from(file, 'base64');
        } else {
          return res.status(400).json({ error: 'Invalid file format. Use base64 encoding.' });
        }
      }

      // Build folder path: nilgiri_media/Nilgiri Website/[category]
      let finalCategory = category;
      finalCategory = finalCategory.trim();
      const folder = `Nilgiri Website/${finalCategory}`;

      if (!filename) {
        filename = `upload-${Date.now()}.bin`;
      }

      // Generate unique filename
      const ext = filename.substring(filename.lastIndexOf('.'));
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uniqueFilename = `${uniqueId}${ext}`;
      const fullPath = `${folder}/${uniqueFilename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fullPath, buffer, {
          contentType: mimetype || 'application/octet-stream',
          cacheControl: '31536000',
        });

      if (error) {
        throw error;
      }

      const publicUrl = getPublicUrl(bucket, fullPath);

      // Store in media_library table
      try {
        await supabaseAdmin
          .from('media_library')
          .insert({
            bucket,
            folder,
            filename: uniqueFilename,
            filepath: fullPath,
            url: publicUrl,
            mimetype: mimetype || 'application/octet-stream',
            size: buffer.length,
            uploaded_by: 'admin',
            uploaded_at: new Date().toISOString()
          });
      } catch (libraryErr) {
        console.warn('Library insert failed (non-critical):', libraryErr);
      }

      return res.status(200).json({
        url: publicUrl,
        filepath: fullPath,
        filename: uniqueFilename,
        bucket,
        message: 'File uploaded successfully'
      });
    }

    // GET - List files from bucket
    if (req.method === 'GET') {
      const bucket = (req.query.bucket as string) || 'nilgiri_media';
      const folder = (req.query.folder as string) || 'Nilgiri Website/Communities';

      const { data, error } = await supabaseAdmin
        .from('media_library')
        .select('*')
        .eq('bucket', bucket)
        .eq('folder', folder)
        .order('uploaded_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      const files = (data || []).map((file: any) => ({
        id: file.id,
        name: file.filename,
        url: file.url,
        folder: file.folder,
        created_at: file.uploaded_at,
        size: file.size,
        mimetype: file.mimetype,
        filepath: file.filepath
      }));

      return res.status(200).json({
        files,
        bucket,
        folder,
        total: files.length
      });
    }

    // DELETE - Delete file - requires authentication
    if (req.method === 'DELETE') {
      const user = await authenticateRequest(req);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!ALL_ROLES.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { bucket, filepath, id } = req.body;

      if (!bucket || !filepath) {
        return res.status(400).json({ error: 'bucket and filepath required' });
      }

      // Delete from storage
      const { error: storageError } = await supabaseAdmin.storage
        .from(bucket)
        .remove([filepath]);

      if (storageError) {
        throw storageError;
      }

      // Delete from media_library table
      if (id) {
        await supabaseAdmin
          .from('media_library')
          .delete()
          .eq('id', id);
      }

      return res.status(200).json({ message: 'File deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error.message || 'Upload operation failed'
    });
  }
}
