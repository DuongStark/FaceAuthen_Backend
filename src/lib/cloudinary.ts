import { v2 as cloudinary } from 'cloudinary';

// Cấu hình Cloudinary từ CLOUDINARY_URL trong .env
// CLOUDINARY_URL có format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
// Cloudinary SDK tự động đọc CLOUDINARY_URL từ env

// Nếu không có CLOUDINARY_URL, sử dụng các biến riêng lẻ
if (!process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadResult {
  publicId: string;
  imageUrl: string;
  width: number;
  height: number;
  format: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 giây

/**
 * Delay helper function
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Upload ảnh lên Cloudinary từ buffer (single attempt)
 */
const uploadImageOnce = (
  buffer: Buffer,
  folder: string
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' }, // Giới hạn kích thước tối đa
          { quality: 'auto:good' }, // Tự động tối ưu chất lượng
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            publicId: result.public_id,
            imageUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Upload ảnh lên Cloudinary từ buffer với retry logic
 * @param buffer - Buffer của file ảnh
 * @param folder - Thư mục lưu trên Cloudinary
 * @param maxRetries - Số lần retry tối đa (mặc định 3)
 * @returns Promise<UploadResult>
 */
export const uploadImage = async (
  buffer: Buffer,
  folder: string = 'face_images',
  maxRetries: number = MAX_RETRIES
): Promise<UploadResult> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadImageOnce(buffer, folder);
      if (attempt > 1) {
        console.log(`Upload succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Upload attempt ${attempt}/${maxRetries} failed:`, (error as Error).message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delayTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      }
    }
  }

  throw lastError || new Error('Upload failed after all retries');
};

/**
 * Xóa ảnh trên Cloudinary theo public_id
 * @param publicId - Public ID của ảnh cần xóa
 * @returns Promise<boolean>
 */
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

export default cloudinary;

