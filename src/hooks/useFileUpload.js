import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useFileUpload(projectId = null) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const deleteFile = async (fileKey, assetId) => {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch('/api/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, assetId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete file');
      }
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const uploadFile = async (file, purpose = 'general', folderOverride = null) => {
    setUploading(true);
    setError(null);

    try {
      // 1. Get Signed URL
      const response = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: folderOverride || `projects/${projectId || 'temp'}/${purpose}`
        })
      });

      if (!response.ok) throw new Error('Failed to get upload signature');
      const { url, key, publicUrl } = await response.json();

      // 2. Upload to R2
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file to storage');

      // 3. Save Metadata to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: asset, error: dbError } = await supabase
        .from('premium_assets')
        .insert({
          user_id: user?.id,
          project_id: projectId, // Can be null if generic
          file_key: key,
          file_url: publicUrl || key, // Fallback if no public domain
          file_type: file.type,
          original_name: file.name,
          size_bytes: file.size,
          purpose: purpose
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return asset;

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, deleteFile, uploading, deleting, error };
}
