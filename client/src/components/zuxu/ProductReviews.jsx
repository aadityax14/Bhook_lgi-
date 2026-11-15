import { useCallback, useEffect, useState } from 'react';
import { Camera, MessageSquareHeart, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PhotoStrip, Stars } from './ZuxuShared';

/*
 * Reviews on a Zuxu product page.
 * Written only by customers who received the product (checked on the
 * server); shows every photo they uploaded.
 */
export default function ProductReviews({ productId, onSummary }) {
  const { isAdmin } = useAuth();
  const [data, setData] = useState({ reviews: [], average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getProductReviews(productId);
      const next = res.data || { reviews: [], average: 0, count: 0 };
      setData(next);
      onSummary?.({ average: next.average, count: next.count });
    } catch (err) {
      console.warn('Could not load reviews:', err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const removeReview = async (id) => {
    try {
      await api.deleteReview(id);
      await load();
    } catch (err) {
      console.warn('Could not delete review:', err.message);
    }
  };

  const customerPhotos = data.reviews.flatMap((r) => r.images || []);
  const shown = withPhotosOnly ? data.reviews.filter((r) => r.images?.length) : data.reviews;

  return (
    <section className="border-t px-4 sm:px-7 py-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <MessageSquareHeart className="w-5 h-5 text-pink-600" />
            Customer reviews
          </h2>
          {data.count > 0 ? (
            <div className="mt-1 flex items-center gap-2">
              <Stars value={data.average} size={18} />
              <span className="text-sm font-black">{data.average}</span>
              <span className="text-xs text-gray-500">({data.count} review{data.count === 1 ? '' : 's'})</span>
            </div>
          ) : (
            !loading && (
              <p className="text-xs text-gray-500 mt-1">
                No reviews yet. Customers can review after their order is delivered.
              </p>
            )
          )}
        </div>

        {customerPhotos.length > 0 && (
          <button
            type="button"
            onClick={() => setWithPhotosOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black border ${
              withPhotosOnly ? 'bg-pink-600 text-white border-pink-600' : 'bg-white border-gray-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            With photos ({data.reviews.filter((r) => r.images?.length).length})
          </button>
        )}
      </div>

      {/* All photos customers received */}
      {customerPhotos.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2">Photos from customers</p>
          <PhotoStrip images={customerPhotos} size="w-20 h-20" />
        </div>
      )}

      <div className="space-y-3">
        {shown.map((review) => (
          <article key={review.id} className="rounded-2xl border border-gray-100 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Stars value={review.rating} size={14} />
                <p className="mt-1 text-xs font-bold text-gray-700">
                  {review.authorName} · <span className="text-emerald-600">Verified buyer</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => removeReview(review.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    title="Remove review (admin)"
                    aria-label="Remove review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {review.text && <p className="text-sm text-gray-700 whitespace-pre-line">{review.text}</p>}

            {/* Every photo this customer uploaded */}
            <PhotoStrip images={review.images} />
          </article>
        ))}
      </div>
    </section>
  );
}
