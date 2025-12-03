/**
 * ImageCompressionService - Képek tömörítése és optimalizálása
 * Implements Requirement 2.3
 */
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import Logger from './Logger';
import ErrorHandler, { ErrorCodes } from './ErrorHandler';

class ImageCompressionService {
  constructor() {
    this.maxSizeKB = 200; // 200KB maximum
    this.maxWidth = 1080;
    this.maxHeight = 1920;
    this.quality = 0.8;
  }

  /**
   * Kép tömörítése
   * @param {string} uri - Kép URI
   * @param {object} options - Tömörítési opciók
   * @returns {Promise<object>} - { uri, width, height, size }
   */
  async compressImage(uri, options = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      const maxSize = options.maxSizeKB || this.maxSizeKB;
      const maxWidth = options.maxWidth || this.maxWidth;
      const maxHeight = options.maxHeight || this.maxHeight;
      let quality = options.quality || this.quality;

      // Eredeti kép méretének lekérése
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const originalSizeKB = fileInfo.size / 1024;

      Logger.debug('Compressing image', {
        originalSize: `${originalSizeKB.toFixed(2)} KB`,
        targetSize: `${maxSize} KB`,
      });

      // Ha már elég kicsi, nem kell tömöríteni
      if (originalSizeKB <= maxSize) {
        Logger.debug('Image already small enough', { size: originalSizeKB });
        return {
          uri,
          size: fileInfo.size,
          sizeKB: originalSizeKB,
          compressed: false,
        };
      }

      // Kép átméretezése és tömörítése
      let compressedUri = uri;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const result = await ImageManipulator.manipulateAsync(
          compressedUri,
          [
            {
              resize: {
                width: maxWidth,
                height: maxHeight,
              },
            },
          ],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        compressedUri = result.uri;

        // Tömörített méret ellenőrzése
        const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
        const compressedSizeKB = compressedInfo.size / 1024;

        Logger.debug('Compression attempt', {
          attempt: attempts + 1,
          quality,
          size: `${compressedSizeKB.toFixed(2)} KB`,
        });

        // Ha elég kicsi, kész
        if (compressedSizeKB <= maxSize) {
          Logger.success('Image compressed successfully', {
            originalSize: `${originalSizeKB.toFixed(2)} KB`,
            compressedSize: `${compressedSizeKB.toFixed(2)} KB`,
            reduction: `${((1 - compressedSizeKB / originalSizeKB) * 100).toFixed(1)}%`,
          });

          return {
            uri: compressedUri,
            width: result.width,
            height: result.height,
            size: compressedInfo.size,
            sizeKB: compressedSizeKB,
            compressed: true,
            originalSizeKB,
            reduction: ((1 - compressedSizeKB / originalSizeKB) * 100).toFixed(1),
          };
        }

        // Minőség csökkentése a következő próbálkozáshoz
        quality -= 0.1;
        attempts++;

        if (quality < 0.3) {
          // Ha túl alacsony a minőség, csökkentsük a méretet is
          maxWidth = Math.floor(maxWidth * 0.8);
          maxHeight = Math.floor(maxHeight * 0.8);
          quality = 0.7;
        }
      }

      // Ha nem sikerült elérni a célt, visszaadjuk az utolsó eredményt
      const finalInfo = await FileSystem.getInfoAsync(compressedUri);
      const finalSizeKB = finalInfo.size / 1024;

      Logger.warn('Could not reach target size', {
        targetSize: maxSize,
        finalSize: finalSizeKB,
      });

      return {
        uri: compressedUri,
        size: finalInfo.size,
        sizeKB: finalSizeKB,
        compressed: true,
        originalSizeKB,
        warning: 'Target size not reached',
      };
    }, { operation: 'compressImage' });
  }

  /**
   * Több kép tömörítése egyszerre
   */
  async compressMultipleImages(uris, options = {}) {
    return ErrorHandler.wrapServiceCall(async () => {
      const results = [];

      for (const uri of uris) {
        const result = await this.compressImage(uri, options);
        if (result.success) {
          results.push(result.data);
        } else {
          Logger.warn('Image compression failed', { uri, error: result.error });
          results.push({ uri, error: result.error, compressed: false });
        }
      }

      Logger.success('Multiple images compressed', { count: results.length });
      return results;
    }, { operation: 'compressMultipleImages', count: uris.length });
  }

  /**
   * Thumbnail generálása
   */
  async generateThumbnail(uri, width = 200, height = 200) {
    return ErrorHandler.wrapServiceCall(async () => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width,
              height,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const fileInfo = await FileSystem.getInfoAsync(result.uri);

      Logger.debug('Thumbnail generated', {
        width: result.width,
        height: result.height,
        size: `${(fileInfo.size / 1024).toFixed(2)} KB`,
      });

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        size: fileInfo.size,
      };
    }, { operation: 'generateThumbnail' });
  }

  /**
   * Kép crop-olása
   */
  async cropImage(uri, cropData) {
    return ErrorHandler.wrapServiceCall(async () => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: cropData.x,
              originY: cropData.y,
              width: cropData.width,
              height: cropData.height,
            },
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      Logger.debug('Image cropped', {
        width: result.width,
        height: result.height,
      });

      return result;
    }, { operation: 'cropImage' });
  }

  /**
   * Kép forgatása
   */
  async rotateImage(uri, degrees) {
    return ErrorHandler.wrapServiceCall(async () => {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            rotate: degrees,
          },
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      Logger.debug('Image rotated', { degrees });
      return result;
    }, { operation: 'rotateImage' });
  }

  /**
   * Kép flip-elése
   */
  async flipImage(uri, direction = 'horizontal') {
    return ErrorHandler.wrapServiceCall(async () => {
      const flipAction = direction === 'horizontal'
        ? { flip: ImageManipulator.FlipType.Horizontal }
        : { flip: ImageManipulator.FlipType.Vertical };

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [flipAction],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      Logger.debug('Image flipped', { direction });
      return result;
    }, { operation: 'flipImage' });
  }

  /**
   * Kép validálása
   */
  async validateImage(uri) {
    return ErrorHandler.wrapServiceCall(async () => {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw ErrorHandler.createError(
          ErrorCodes.VALIDATION_INVALID_FORMAT,
          'File does not exist',
          { uri }
        );
      }

      const sizeKB = fileInfo.size / 1024;
      const sizeMB = sizeKB / 1024;

      // Maximum 5MB
      if (sizeMB > 5) {
        throw ErrorHandler.createError(
          ErrorCodes.VALIDATION_FILE_TOO_LARGE,
          'File size exceeds 5MB',
          { size: sizeMB }
        );
      }

      // Fájl típus ellenőrzése (URI alapján)
      const extension = uri.split('.').pop().toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'heic'];

      if (!validExtensions.includes(extension)) {
        throw ErrorHandler.createError(
          ErrorCodes.VALIDATION_INVALID_FILE_TYPE,
          'Invalid file type',
          { extension, validExtensions }
        );
      }

      Logger.debug('Image validated', {
        size: `${sizeKB.toFixed(2)} KB`,
        extension,
      });

      return {
        valid: true,
        size: fileInfo.size,
        sizeKB,
        sizeMB,
        extension,
      };
    }, { operation: 'validateImage' });
  }

  /**
   * Batch image processing
   */
  async processBatch(images, operations) {
    return ErrorHandler.wrapServiceCall(async () => {
      const results = [];

      for (const image of images) {
        let processedUri = image.uri;

        for (const operation of operations) {
          switch (operation.type) {
            case 'compress':
              const compressed = await this.compressImage(processedUri, operation.options);
              if (compressed.success) {
                processedUri = compressed.data.uri;
              }
              break;

            case 'resize':
              const resized = await ImageManipulator.manipulateAsync(
                processedUri,
                [{ resize: operation.options }],
                { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
              );
              processedUri = resized.uri;
              break;

            case 'crop':
              const cropped = await this.cropImage(processedUri, operation.options);
              if (cropped.success) {
                processedUri = cropped.data.uri;
              }
              break;

            case 'rotate':
              const rotated = await this.rotateImage(processedUri, operation.degrees);
              if (rotated.success) {
                processedUri = rotated.data.uri;
              }
              break;
          }
        }

        results.push({
          originalUri: image.uri,
          processedUri,
          operations: operations.map(op => op.type),
        });
      }

      Logger.success('Batch processing complete', { count: results.length });
      return results;
    }, { operation: 'processBatch', count: images.length });
  }

  /**
   * Kép méretének lekérése
   */
  async getImageDimensions(uri) {
    return ErrorHandler.wrapServiceCall(async () => {
      const result = await ImageManipulator.manipulateAsync(uri, [], {});
      
      Logger.debug('Image dimensions fetched', {
        width: result.width,
        height: result.height,
      });

      return {
        width: result.width,
        height: result.height,
        aspectRatio: result.width / result.height,
      };
    }, { operation: 'getImageDimensions' });
  }
}

export default new ImageCompressionService();
