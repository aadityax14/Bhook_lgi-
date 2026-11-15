import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// =============================================================
// IMAGE UPLOADS
//
// The browser compresses photos and sends them as base64 data
// URLs. Here we check they really are JPEG / PNG / WebP images
// (by their bytes, not just the label), enforce a size limit and
// save them with a random file name under server/uploads.
// They are served at /api/uploads/<file>.
// =============================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
export const UPLOAD_URL_PREFIX = '/api/uploads/';

// Size of ONE image after the browser has compressed it.
export const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB

const SIGNATURES = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  webp: (b) =>
    b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export class UploadError extends Error {}

/**
 * Save one data-URL image. Returns its public URL path.
 */
export function saveImage(dataUrl, { maxBytes = MAX_IMAGE_BYTES } = {}) {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(
    String(dataUrl || '')
  );

  if (!match) {
    throw new UploadError('Please upload JPG, PNG or WebP photos.');
  }

  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length === 0) {
    throw new UploadError('One of the photos is empty.');
  }

  if (buffer.length > maxBytes) {
    throw new UploadError(
      `Each photo must be under ${Math.round(maxBytes / 1024 / 1024)} MB after compression.`
    );
  }

  const ext = Object.keys(SIGNATURES).find((key) => SIGNATURES[key](buffer));

  if (!ext) {
    throw new UploadError('That file is not a valid image.');
  }

  const fileName = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);

  return `${UPLOAD_URL_PREFIX}${fileName}`;
}

/**
 * Save a list of images (all-or-nothing on validation).
 */
export function saveImages(list, { min = 0, max = 3 } = {}) {
  const images = Array.isArray(list) ? list : [];

  if (images.length < min) {
    throw new UploadError(`Please add at least ${min} photo${min === 1 ? '' : 's'}.`);
  }

  if (images.length > max) {
    throw new UploadError(`You can add at most ${max} photos.`);
  }

  const saved = [];

  try {
    for (const image of images) {
      saved.push(saveImage(image));
    }
  } catch (error) {
    deleteImages(saved);
    throw error;
  }

  return saved;
}

// Only deletes files inside the upload folder.
export function deleteImages(urls = []) {
  for (const url of urls) {
    if (typeof url !== 'string' || !url.startsWith(UPLOAD_URL_PREFIX)) continue;

    const fileName = path.basename(url);
    const filePath = path.join(UPLOAD_DIR, fileName);

    if (path.dirname(filePath) === UPLOAD_DIR && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export const isUploadedImageUrl = (url) =>
  typeof url === 'string' &&
  url.startsWith(UPLOAD_URL_PREFIX) &&
  /^[a-f0-9-]+\.(jpg|png|webp)$/.test(path.basename(url));
