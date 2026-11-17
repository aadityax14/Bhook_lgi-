// Shared photo helpers for customer / admin uploads.

// Largest original photo we accept from the phone/computer.
export const MAX_ORIGINAL_MB = 5;

/**
 * Shrink a photo in the browser before uploading:
 * longest side ≤ maxDimension, saved as JPEG.
 * Keeps uploads well under the server's 1 MB-per-photo limit.
 */
export function compressPhoto(file, { maxDimension = 1280, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      reject(new Error('Please choose a JPG, PNG or WebP photo.'));
      return;
    }

    if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) {
      reject(new Error(`Each photo must be under ${MAX_ORIGINAL_MB} MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the photo.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Could not open this photo.'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Photo processing is not supported in this browser.'));
          return;
        }

        // White background so transparent PNGs don't turn black.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Add photos from an <input type="file"> to an existing list,
 * respecting the maximum count. Returns { images, error }.
 */
export async function addPhotos(fileList, current = [], max = 3) {
  const files = Array.from(fileList || []);
  const room = Math.max(0, max - current.length);

  if (room === 0) {
    return { images: current, error: `You can add at most ${max} photos.` };
  }

  try {
    const compressed = await Promise.all(files.slice(0, room).map((f) => compressPhoto(f)));
    return {
      images: [...current, ...compressed],
      error: files.length > room ? `Only ${max} photos allowed — extra ones were skipped.` : '',
    };
  } catch (error) {
    return { images: current, error: error.message };
  }
}
