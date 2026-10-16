import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { FiLock } from 'react-icons/fi';
import { confirmOrderPayment } from '../../api/orders';
import { formatLKR, getErrorMessage } from '../../utils/formatters';

// loadStripe must run once per key, not on every render
const stripeByKey = {};
const getStripe = (publishableKey) => {
  if (!stripeByKey[publishableKey]) stripeByKey[publishableKey] = loadStripe(publishableKey);
  return stripeByKey[publishableKey];
};

/**
 * Stripe's secure card form for one order. Card details go straight from the browser to
 * Stripe — they never touch our server. After Stripe accepts the payment we ask our
 * backend to verify it with Stripe, and onPaid receives the updated order.
 */
export default function StripePaymentForm({ orderId, clientSecret, publishableKey, amount, onPaid }) {
  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#0f766e', borderRadius: '8px', fontFamily: 'inherit' },
        },
      }}
    >
      <PaymentFormInner orderId={orderId} amount={amount} onPaid={onPaid} />
    </Elements>
  );
}

function PaymentFormInner({ orderId, amount, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError('');
    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        // Only used by payment methods that leave the page (e.g. bank 3-D Secure redirects)
        confirmParams: { return_url: `${window.location.origin}/orders/${orderId}?payment=return` },
        redirect: 'if_required',
      });
      if (stripeError) {
        // Card declined, wrong CVC, etc. — the customer can correct it and try again
        setError(stripeError.message || 'Payment failed. Please try another card.');
        return;
      }
      const { data } = await confirmOrderPayment(orderId);
      onPaid(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handlePay}>
      <PaymentElement onReady={() => setReady(true)} options={{ layout: 'tabs' }} />
      {error && (
        <div role="alert" style={{
          marginTop: '1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          borderRadius: 8, padding: '0.65rem 0.875rem', fontSize: '0.85rem',
        }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || !ready || paying}
        style={{
          width: '100%', marginTop: '1.25rem', padding: '0.875rem', border: 'none', borderRadius: 8,
          background: '#0f3460', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: !stripe || !ready || paying ? 'not-allowed' : 'pointer',
          opacity: !stripe || !ready || paying ? 0.7 : 1,
        }}
      >
        <FiLock size={16} /> {paying ? 'Processing payment...' : `Pay ${formatLKR(amount)}`}
      </button>
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
        Payments are processed securely by Stripe. We never see or store your card details.
      </p>
    </form>
  );
}
