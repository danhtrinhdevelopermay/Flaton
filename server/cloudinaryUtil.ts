import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'djqn5rqmb',
  api_key: '184925594419347',
  api_secret: 'AbWMHjRqaYdE0CIDkh6RUXzchbw',
});

export async function uploadImageToCloudinary(imageUrl: string): Promise<string> {
  try {
    console.log('[Cloudinary] Starting upload for:', imageUrl);
    // Remove format: 'jpg' to allow Cloudinary to auto-detect or keep original format (like PNG)
    const result = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      folder: 'flaton/images',
      quality: 'auto',
      fetch_format: 'auto' // Use auto format detection
    });
    console.log('[Cloudinary] Upload success:', result.secure_url);
    return result.secure_url;
  } catch (error: any) {
    console.error('[Cloudinary] Upload failed:', error.message || error);
    return imageUrl;
  }
}

export async function uploadVideoToCloudinary(videoUrl: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(videoUrl, {
      resource_type: 'video',
      folder: 'flaton/videos',
      quality: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    return videoUrl; // Return original URL if upload fails
  }
}

export async function uploadAudioToCloudinary(audioUrl: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(audioUrl, {
      resource_type: 'video', // Cloudinary uses 'video' for audio too
      folder: 'flaton/music',
      quality: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading audio to Cloudinary:', error);
    return audioUrl; // Return original URL if upload fails
  }
}
