// Zuxu advertisement shown above the customer's order tracking.
// The admin can change it (Admin → Banners); this is the default.
export const DEFAULT_TRACKING_AD = {
  enabled: true,
  badge: '🎁 HANDMADE WITH LOVE',
  title: 'Make Someone Smile ❤️',
  subtitle: 'Discover handmade gifts, crochet, rings and cute accessories.',
  buttonText: 'Explore Zuxu →',
  images: ['/zuxu.png'],
};

// Saved ad from the server (or null) → complete ad to show.
export function withTrackingAdDefaults(saved) {
  if (!saved || typeof saved !== 'object') return DEFAULT_TRACKING_AD;
  const images = Array.isArray(saved.images) ? saved.images.filter(Boolean) : [];
  return {
    ...DEFAULT_TRACKING_AD,
    ...Object.fromEntries(Object.entries(saved).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
    enabled: saved.enabled !== false,
    images: images.length > 0 ? images : DEFAULT_TRACKING_AD.images,
  };
}
