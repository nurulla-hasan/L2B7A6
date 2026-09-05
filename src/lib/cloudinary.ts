import { v2 as Cloudinary, type UploadApiResponse } from 'cloudinary';
import config from '../config/index';

Cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

export const cloudinary = Cloudinary;

export const uploadToCloudinary = (
  buffer: Buffer,
  folder = 'portal/profiles',
  transformation?: Record<string, unknown>[],
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const defaultTransform =
      folder === 'portal/profiles'
        ? [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ]
        : [{ quality: 'auto', fetch_format: 'auto' }];

    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: transformation || defaultTransform,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No result returned from Cloudinary.'));
          resolve(result);
        },
      )
      .end(buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'raw' | 'auto' = 'image',
): Promise<void> => {
  if (!publicId) return;
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as 'image' | 'raw',
    });
    if (res.result !== 'ok' && resourceType === 'image') {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }
  } catch (error) {
    console.error('Failed to delete asset from Cloudinary:', error);
  }
};
