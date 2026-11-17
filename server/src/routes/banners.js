import express from 'express';
import { store } from '../db/store.js';
import { requireRole } from '../middleware/auth.js';
import { saveImage, isUploadedImageUrl, UploadError } from '../services/uploads.js';

// =============================================================
// HOMEPAGE HERO BANNERS
// Saved on the server so every customer sees what the admin set.
// =============================================================

const router = express.Router();
const adminOnly = requireRole('ADMIN');

const MAX_SLIDES = 8;
const BANNER_IMAGE_BYTES = 2 * 1024 * 1024; // wide banners can be bigger

const TEXT_LIMITS = {
  id: 40,
  title: 60,
  subtitle: 160,
  badge: 40,
  buttonText: 30,
  emoji: 8,
  background: 120
};

// Only safe links: an in-app path or an https:// website.
// (Blocks "javascript:" and other dangerous links.)
function cleanLink(value) {
  const link = String(value || '').trim();
  if (!link) return '';
  if (/^\/[A-Za-z0-9/_-]*$/.test(link)) return link;
  try {
    const url = new URL(link);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanImage(value) {
  const image = String(value || '').trim();
  if (!image) return '';
  if (image === '/zuxu.png' || isUploadedImageUrl(image)) return image;
  return null;
}

// GET /api/banners  (public) → slides or null (= use app defaults)
router.get('/', (req, res) => {
  res.json({ success: true, data: store.getBanners() });
});

// POST /api/banners/upload  { image: dataUrl } → { url }
router.post('/upload', adminOnly, (req, res) => {
  try {
    const url = saveImage(req.body?.image, { maxBytes: BANNER_IMAGE_BYTES });
    res.status(201).json({ success: true, data: { url } });
  } catch (error) {
    if (error instanceof UploadError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('BANNER UPLOAD ERROR:', error);
    res.status(500).json({ success: false, error: 'Could not upload the banner image.' });
  }
});

// PUT /api/banners  { slides: [...] }  (admin)
router.put('/', adminOnly, (req, res) => {
  const slides = req.body?.slides;

  if (!Array.isArray(slides) || slides.length === 0 || slides.length > MAX_SLIDES) {
    return res.status(400).json({ success: false, error: `Send between 1 and ${MAX_SLIDES} banners.` });
  }

  const cleaned = [];

  for (const [index, slide] of slides.entries()) {
    if (!slide || typeof slide !== 'object') {
      return res.status(400).json({ success: false, error: `Banner ${index + 1} is invalid.` });
    }

    const out = {};

    for (const [field, max] of Object.entries(TEXT_LIMITS)) {
      out[field] = String(slide[field] ?? '').trim().slice(0, max);
    }

    if (!out.id) out.id = `slide-${index + 1}`;

    const link = cleanLink(slide.link);
    if (link === null) {
      return res.status(400).json({
        success: false,
        error: `Banner ${index + 1}: the link must start with / or https://`
      });
    }

    const image = cleanImage(slide.image);
    if (image === null) {
      return res.status(400).json({
        success: false,
        error: `Banner ${index + 1}: please upload the image again.`
      });
    }

    out.link = link;
    out.image = image;
    out.actionType = slide.actionType === 'external' ? 'external' : 'internal';
    out.enabled = slide.enabled !== false;

    cleaned.push(out);
  }

  res.json({ success: true, data: store.setBanners(cleaned) });
});

// DELETE /api/banners  (admin) → back to app defaults
router.delete('/', adminOnly, (req, res) => {
  store.setBanners(null);
  res.json({ success: true, data: null });
});

export default router;
