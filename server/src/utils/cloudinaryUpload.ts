import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary';

/**
 * Streams a buffer directly to Cloudinary (no temp file on disk).
 * Returns the secure_url of the uploaded file.
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = 'creditsea'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload failed:', error?.message || error);
          return reject(new Error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`));
        }
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};
