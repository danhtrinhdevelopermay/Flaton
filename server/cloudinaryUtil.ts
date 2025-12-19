import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'djqn5rqmb',
  api_key: '184925594419347',
  api_secret: 'AbWMHjRqaYdE0CIDkh6RUXzchbw',
});

export async function uploadImageToCloudinary(imageUrl: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      resource_type: 'image',
      folder: 'flaton/images',
      format: 'jpg',
      quality: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return imageUrl; // Return original URL if upload fails
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
