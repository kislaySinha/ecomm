import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';
import { Star, MessageSquare } from 'lucide-react';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';

function StarRating({ rating }) {
  return <span style={{ color: '#f59e0b' }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await reviewAPI.getAll(page * limit, limit);
        setReviews(res.data.reviews || []);
        setTotal(res.data.total || 0);
      } catch {
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  if (loading) return <Loading message="Loading reviews..." />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Customer Reviews</h1>
        <p className="page-subtitle">{total} review{total !== 1 ? 's' : ''}</p>
      </div>

      {reviews.length === 0 ? (
        <div className="empty-state">
          <MessageSquare className="empty-state-icon" />
          <h2 className="empty-state-title">No reviews yet</h2>
          <p className="empty-state-description">Be the first to review a product!</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <StarRating rating={review.rating} />
                    {review.product_name && (
                      <span style={{ marginLeft: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-accent)' }}>
                        {review.product_name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'right' }}>
                    <div>{review.reviewer_email?.replace(/(.{2}).*@/, '$1***@')}</div>
                    <div>{new Date(review.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                {review.comment && <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: '1.5' }}>{review.comment}</p>}
              </div>
            ))}
          </div>

          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-secondary">
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                Page {page + 1} of {Math.ceil(total / limit)}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * limit >= total} className="btn btn-secondary">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
