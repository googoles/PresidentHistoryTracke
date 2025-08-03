/**
 * Mobile-optimized image compression utilities
 * Provides functions for compressing images before upload on mobile devices
 */

/**
 * Compress an image file for mobile upload
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Resize image to specific dimensions for thumbnails
 * @param {File} file - The image file to resize
 * @param {Object} options - Resize options
 * @returns {Promise<File>} - Resized image file
 */
export const createThumbnail = async (file, options = {}) => {
  const {
    width = 300,
    height = 300,
    quality = 0.7
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // Calculate crop dimensions to maintain aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller than canvas
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(thumbnailFile);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get optimal compression settings based on file size and device capabilities
 * @param {File} file - The file to analyze
 * @returns {Object} - Optimal compression settings
 */
export const getOptimalCompressionSettings = (file) => {
  const fileSize = file.size;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Base settings
  let settings = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8
  };

  // Adjust for file size
  if (fileSize > 5 * 1024 * 1024) { // > 5MB
    settings.quality = 0.6;
    settings.maxWidth = 1000;
    settings.maxHeight = 1000;
  } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
    settings.quality = 0.7;
  }

  // Adjust for mobile devices
  if (isMobile) {
    settings.maxWidth = 800;
    settings.maxHeight = 800;
    settings.quality = Math.min(settings.quality, 0.7);
  }

  return settings;
};

/**
 * Validate image file before processing
 * @param {File} file - The file to validate
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!file) {
    return { valid: false, error: '파일이 선택되지 않았습니다.' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '지원되지 않는 파일 형식입니다. (JPEG, PNG, WebP만 지원)' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기가 너무 큽니다. (최대 10MB)' };
  }

  return { valid: true };
};

/**
 * Process image file with automatic optimization for mobile
 * @param {File} file - The image file to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processed image data
 */
export const processImageForMobile = async (file, options = {}) => {
  // Validate file first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const {
    createThumbnail: shouldCreateThumbnail = true,
    ...compressionOptions
  } = options;

  try {
    // Get optimal settings
    const optimalSettings = getOptimalCompressionSettings(file);
    const finalSettings = { ...optimalSettings, ...compressionOptions };

    // Compress main image
    const compressedImage = await compressImage(file, finalSettings);

    const result = {
      original: file,
      compressed: compressedImage,
      compressionRatio: ((file.size - compressedImage.size) / file.size * 100).toFixed(1)
    };

    // Create thumbnail if requested
    if (shouldCreateThumbnail) {
      result.thumbnail = await createThumbnail(compressedImage);
    }

    return result;
  } catch (error) {
    throw new Error(`이미지 처리 중 오류가 발생했습니다: ${error.message}`);
  }
};

/**
 * Get image dimensions without loading the full image
 * @param {File} file - The image file
 * @returns {Promise<Object>} - Image dimensions
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};