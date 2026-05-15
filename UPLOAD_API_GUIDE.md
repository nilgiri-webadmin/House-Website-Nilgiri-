# Frontend Upload API - Quick Reference

## Updated Upload Endpoint

### Endpoint
```
POST /api/upload
Authorization: Bearer {JWT_TOKEN}
```

### Request Format

#### Option 1: Using FormData (Recommended)
```javascript
const uploadImage = async (file, category) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('bucket', 'nilgiri_media');

  const response = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  });

  return response.json();
};
```

### Categories (Folder Names)
Use these categories when uploading images:

| Category | Folder Path | Use Case |
|----------|-------------|----------|
| `Events` | `Nilgiri Website/Events/` | Event posters, banners |
| `Meetups` | `Nilgiri Website/Meetups/` | Meetup images |
| `Communities` | `Nilgiri Website/Communities/` | Community profiles, logos |
| `Council` | `Nilgiri Website/Council/` | Council member photos |
| `Achievements` | `Nilgiri Website/Achievements/` | Achievement badges |
| `Gallery` | `Nilgiri Website/Gallery/` | Gallery images |

### Response
```json
{
  "url": "https://projectid.supabase.co/storage/v1/object/public/nilgiri_media/nilgiri_website/Events/1234567890-abc.jpg",
  "filepath": "nilgiri_website/Events/1234567890-abc.jpg",
  "filename": "1234567890-abc.jpg",
  "bucket": "nilgiri_media",
  "message": "File uploaded successfully"
}
```

### Error Responses

**Missing Token:**
```json
{ "error": "No token provided" }
```

**Insufficient Permissions:**
```json
{
  "error": "Forbidden - insufficient permissions",
  "userRole": "viewer",
  "requiredRoles": ["secretary", "webadmin", "club"]
}
```

**Invalid File:**
```json
{ "error": "Only .webp, .png, .jpg, and .jpeg images are allowed." }
```

---

## Usage Examples

### React Component Example
```jsx
import { useState } from 'react';

export default function ImageUpload() {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Events');
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error);
        return;
      }

      const data = await response.json();
      setImageUrl(data.url);
      setError(null);
      console.log('✅ Uploaded to:', data.filepath);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option>Events</option>
        <option>Meetups</option>
        <option>Communities</option>
        <option>Council</option>
        <option>Achievements</option>
        <option>Gallery</option>
      </select>
      
      <input 
        type="file" 
        onChange={(e) => setFile(e.target.files?.[0])} 
        accept="image/*"
      />
      
      <button type="submit">Upload</button>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {imageUrl && (
        <>
          <p>✅ Uploaded successfully!</p>
          <img src={imageUrl} alt="Uploaded" />
          <p>URL: {imageUrl}</p>
        </>
      )}
    </form>
  );
}
```

### GET Uploaded Images
```javascript
// Get all images from a specific category
const getImages = async (category) => {
  const response = await fetch(
    `/api/upload/list/nilgiri_media?category=${category}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );
  return response.json();
};
```

---

## CRUD Operations - Fixed

### Create Event
```javascript
const createEvent = async (eventData) => {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      title: 'Tech Talk',
      date: '2026-03-15',
      time: '10:00 AM',
      location: 'Auditorium',
      category: 'Workshop',
      img_url: 'https://...' // Use URL from upload
    })
  });
  return response.json();
};
```

### Update Event
```javascript
const updateEvent = async (eventId, updates) => {
  const response = await fetch(`/api/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(updates)
  });
  return response.json();
};
```

### Delete Event
```javascript
const deleteEvent = async (eventId) => {
  const response = await fetch(`/api/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  return response.json();
};
```

---

## Authentication Tokens

Your JWT token must have one of these roles:
- `secretary` - Full admin access
- `webadmin` - Full admin access  
- `club` - Can manage club content (events, meetups, etc.)
- ~~`viewer`~~ - ❌ Cannot modify content (read-only)

### Token Structure
```json
{
  "id": "user-123",
  "email": "user@nilgiri.club",
  "role": "club"
}
```

---

## File Size & Format Limits

- **Max File Size:** 5 MB
- **Allowed Formats:** `.webp`, `.png`, `.jpg`, `.jpeg`
- **Recommended:** Use `.webp` for better compression

---

## Common Issues & Solutions

### ❌ "No token provided"
- Missing `Authorization` header
- Fix: Add `Authorization: Bearer {token}` to headers

### ❌ "Forbidden - insufficient permissions"
- Token has `viewer` role instead of `club`/`webadmin`/`secretary`
- Fix: Contact admin to update your user role

### ❌ "Only .webp, .png, .jpg, and .jpeg images are allowed"
- Uploading unsupported format (e.g., `.gif`, `.bmp`)
- Fix: Convert image to `.jpg` or `.png` first

### ❌ "File size exceeds 5 MB"
- Image is too large
- Fix: Compress image before uploading

### ❌ Images appearing in wrong folder
- Sending incorrect `category` value
- Fix: Use category names from the table above

---

## Environment Variables Needed

Add to backend `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

---

## Backend URL

- **Development:** `http://localhost:3000`
- **Production:** As configured in `BACKEND_URL` env var
