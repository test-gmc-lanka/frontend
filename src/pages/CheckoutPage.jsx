import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCreditCard, FiTruck, FiLock, FiCheckCircle } from 'react-icons/fi';
import { getCart } from '../api/cart';
import { getProfile } from '../api/users';
import { getCheckoutSummary, placeOrder, startOrderPayment } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { formatLKR, getErrorMessage } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import toast from 'react-hot-toast';

const PHONE_PATTERN = /^\+?[0-9 ()-]{9,20}$/;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { refreshCart } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    notes: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [touched, setTouched] = useState({});
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  // Set after a card order is created: { order, payment }
  const [pendingCardOrder, setPendingCardOrder] = useState(null);

  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([getCart(), getCheckoutSummary(), getProfile().catch(() => null)])
      .then(([cartRes, summaryRes, profileRes]) => {
        const cartItems = cartRes.data.items || [];
        if (cartItems.length === 0) {
          navigate('/cart', { replace: true });
          return;
        }
        setItems(cartItems);
        setSummary(summaryRes.data);
        if (summaryRes.data.cardPaymentsEnabled) setPaymentMethod('CARD');
        const p = profileRes?.data;
        if (p) {
          setForm((f) => ({
            ...f,
            shippingName: p.name || '',
            shippingPhone: p.phone || '',
            shippingAddress: p.address || '',
          }));
        }
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [navigate, reloadKey]);

  const errors = {
    shippingName: !form.shippingName.trim() && 'Enter the recipient’s name',
    shippingPhone:
      (!form.shippingPhone.trim() && 'Enter a phone number for the courier') ||
      (!PHONE_PATTERN.test(form.shippingPhone.trim()) && 'Enter a valid phone number, e.g. 077 123 4567'),
    shippingAddress: !form.shippingAddress.trim() && 'Enter the delivery address',
    shippingCity: !form.shippingCity.trim() && 'Enter the city',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const blur = (field) => () => setTouched({ ...touched, [field]: true });
  const showError = (field) => touched[field] && errors[field];

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (hasErrors) {
      setTouched({ shippingName: true, shippingPhone: true, shippingAddress: true, shippingCity: true });
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const { data } = await placeOrder({ ...form, paymentMethod });
      refreshCart(); // the cart is emptied once the order exists
      if (paymentMethod === 'CARD') {
        try {
          const { data: payment } = await startOrderPayment(data.order.orderId);
          if (payment.alreadyPaid) {
            navigate(`/orders/${data.order.orderId}?placed=1`);
            return;
          }
          setPendingCardOrder({ order: data.order, payment });
        } catch (err) {
          // The order exists and its stock is reserved; the customer can pay from the order page
          toast.error(`${getErrorMessage(err)} You can pay from your order page.`);
          navigate(`/orders/${data.order.orderId}?placed=1`);
          return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.success('Order placed successfully!');
        navigate(`/orders/${data.order.orderId}?placed=1`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  const handlePaid = (order) => {
    if (order.paymentStatus === 'COMPLETED') {
      toast.success('Payment successful! Your order is confirmed.');
    } else {
      toast('Payment is processing. We’ll update your order shortly.');
    }
    navigate(`/orders/${order.orderId}?placed=1`);
  };

  if (loading)
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  if (!summary) {
    return (
      <div
        style={{
          background: '#f8fafc',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div
          role="alert"
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            We couldn&rsquo;t load checkout
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {loadError || 'Something went wrong.'} Your cart is safe.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              style={{
                background: '#0f3460',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.6rem 1.2rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
            <Link
              to="/cart"
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '0.6rem 1.2rem',
                fontWeight: 600,
                color: '#374151',
                textDecoration: 'none',
              }}
            >
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#111827' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
        {!pendingCardOrder && (
          <Link
            to="/cart"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#6b7280',
              fontSize: '0.875rem',
              textDecoration: 'none',
              marginBottom: '1rem',
            }}
          >
            <FiArrowLeft size={15} /> Back to cart
          </Link>
        )}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Checkout</h1>
        <Steps current={pendingCardOrder ? 2 : 1} cardPayment={paymentMethod === 'CARD'} />

        <div className="layout-checkout">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div>
            {pendingCardOrder ? (
              <Section icon={<FiCreditCard />} title="Payment">
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    background: '#f0fdfa',
                    border: '1px solid #99f6e4',
                    borderRadius: 8,
                    padding: '0.75rem 0.9rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <FiCheckCircle size={18} color="#0f766e" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: '0.85rem', color: '#134e4a', lineHeight: 1.5 }}>
                    Order <strong>#{pendingCardOrder.order.orderId}</strong> is reserved for you. Complete the payment
                    to confirm it. You can also pay later from{' '}
                    <Link to="/orders" style={{ color: '#0f766e', fontWeight: 600 }}>
                      My Orders
                    </Link>{' '}
                    — unpaid orders are cancelled after 60 minutes.
                  </div>
                </div>
                <StripePaymentForm
                  orderId={pendingCardOrder.order.orderId}
                  clientSecret={pendingCardOrder.payment.clientSecret}
                  publishableKey={pendingCardOrder.payment.publishableKey}
                  amount={pendingCardOrder.order.totalAmount}
                  onPaid={handlePaid}
                />
              </Section>
            ) : (
              <form onSubmit={handlePlaceOrder} noValidate>
                <Section icon={<FiTruck />} title="Delivery details">
                  <div className="form-row-2">
                    <Field id="shippingName" label="Full name" error={showError('shippingName')}>
                      <input
                        id="shippingName"
                        autoComplete="name"
                        value={form.shippingName}
                        onChange={update('shippingName')}
                        onBlur={blur('shippingName')}
                        style={inputStyle(showError('shippingName'))}
                      />
                    </Field>
                    <Field
                      id="shippingPhone"
                      label="Phone number"
                      error={showError('shippingPhone')}
                      hint="The courier will call this number"
                    >
                      <input
                        id="shippingPhone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="077 123 4567"
                        value={form.shippingPhone}
                        onChange={update('shippingPhone')}
                        onBlur={blur('shippingPhone')}
                        style={inputStyle(showError('shippingPhone'))}
                      />
                    </Field>
                  </div>
                  <Field id="shippingAddress" label="Address" error={showError('shippingAddress')}>
                    <textarea
                      id="shippingAddress"
                      rows={2}
                      autoComplete="street-address"
                      placeholder="House number, street, area"
                      value={form.shippingAddress}
                      onChange={update('shippingAddress')}
                      onBlur={blur('shippingAddress')}
                      style={{ ...inputStyle(showError('shippingAddress')), resize: 'vertical' }}
                    />
                  </Field>
                  <div className="form-row-2">
                    <Field id="shippingCity" label="City" error={showError('shippingCity')}>
                      <input
                        id="shippingCity"
                        autoComplete="address-level2"
                        placeholder="Colombo"
                        value={form.shippingCity}
                        onChange={update('shippingCity')}
                        onBlur={blur('shippingCity')}
                        style={inputStyle(showError('shippingCity'))}
                      />
                    </Field>
                    <Field id="shippingPostalCode" label="Postal code (optional)">
                      <input
                        id="shippingPostalCode"
                        autoComplete="postal-code"
                        placeholder="00700"
                        value={form.shippingPostalCode}
                        onChange={update('shippingPostalCode')}
                        style={inputStyle(false)}
                      />
                    </Field>
                  </div>
                  <Field id="notes" label="Delivery notes (optional)">
                    <textarea
                      id="notes"
                      rows={2}
                      maxLength={1000}
                      placeholder="e.g. Call before delivery, gate code, landmark"
                      value={form.notes}
                      onChange={update('notes')}
                      style={{ ...inputStyle(false), resize: 'vertical' }}
                    />
                  </Field>
                </Section>

                <Section icon={<FiCreditCard />} title="Payment method">
                  <div
                    role="radiogroup"
                    aria-label="Payment method"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  >
                    <PaymentOption
                      value="CARD"
                      selected={paymentMethod === 'CARD'}
                      onSelect={setPaymentMethod}
                      disabled={!summary.cardPaymentsEnabled}
                      title="Credit / debit card"
                      description={
                        summary.cardPaymentsEnabled
                          ? 'Visa, Mastercard, Amex — pay securely now with Stripe'
                          : 'Card payments are not available right now'
                      }
                    />
                    <PaymentOption
                      value="CASH_ON_DELIVERY"
                      selected={paymentMethod === 'CASH_ON_DELIVERY'}
                      onSelect={setPaymentMethod}
                      title="Cash on delivery"
                      description="Pay the courier in cash when your order arrives"
                    />
                  </div>
                </Section>

                {error && (
                  <div
                    role="alert"
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: 8,
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={placing}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    border: 'none',
                    borderRadius: 8,
                    background: '#0f3460',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: placing ? 'not-allowed' : 'pointer',
                    opacity: placing ? 0.7 : 1,
                  }}
                >
                  {placing ? (
                    'Placing order...'
                  ) : paymentMethod === 'CARD' ? (
                    <>
                      <FiLock size={16} /> Continue to payment
                    </>
                  ) : (
                    `Place order · ${formatLKR(summary.totalAmount)}`
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── Right column: order summary ────────────────────────────── */}
          <aside
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: '1.25rem',
              position: 'sticky',
              top: 90,
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Order summary</h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1rem',
                maxHeight: 280,
                overflowY: 'auto',
              }}
            >
              {items.map((item) => (
                <div
                  key={item.cartItemId ?? item.product?.productId}
                  style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {item.product?.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt=""
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid #e5e7eb',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          background: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        🪵
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: '#6b7280',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        borderRadius: 999,
                        minWidth: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}
                    >
                      {item.quantity}
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.product?.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatLKR(item.subtotal)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.875rem' }}>
              <Row
                label={`Subtotal (${summary.itemCount} item${summary.itemCount !== 1 ? 's' : ''})`}
                value={formatLKR(summary.subtotal)}
              />
              <Row
                label="Delivery"
                value={Number(summary.shippingFee) === 0 ? 'Free' : formatLKR(summary.shippingFee)}
              />
              <Row label={`VAT (${summary.taxRatePercent}%)`} value={formatLKR(summary.taxAmount)} />
            </div>
            <div
              style={{
                borderTop: '1px solid #e5e7eb',
                marginTop: '0.5rem',
                paddingTop: '0.875rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#0f3460' }}>
                {formatLKR(summary.totalAmount)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Steps({ current, cardPayment }) {
  const steps = cardPayment ? ['Delivery & payment method', 'Pay by card'] : ['Delivery & payment method'];
  if (steps.length === 1) return null;
  return (
    <ol
      style={{
        display: 'flex',
        gap: '1.5rem',
        listStyle: 'none',
        padding: 0,
        margin: '0.5rem 0 0',
        fontSize: '0.82rem',
      }}
    >
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: active || done ? '#0f3460' : '#9ca3af',
              fontWeight: active ? 700 : 500,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: active || done ? '#0f3460' : '#e5e7eb',
                color: active || done ? '#fff' : '#6b7280',
              }}
            >
              {done ? '✓' : n}
            </span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

function Section({ icon, title, children }) {
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '1.25rem 1.25rem 0.5rem',
        marginBottom: '1.25rem',
      }}
    >
      <h2
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '1.05rem',
          fontWeight: 700,
          marginBottom: '1rem',
          color: '#0f3460',
        }}
      >
        {icon} {title}
      </h2>
      <div style={{ paddingBottom: '0.75rem' }}>{children}</div>
    </section>
  );
}

function Field({ id, label, hint, error, children }) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 }}
      >
        {label}
      </label>
      {children}
      {error ? (
        <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: 4 }}>{error}</div>
      ) : (
        hint && <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}

function PaymentOption({ value, selected, onSelect, disabled, title, description }) {
  return (
    <label
      style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        padding: '0.85rem 1rem',
        border: `1.5px solid ${selected ? '#0f766e' : '#e5e7eb'}`,
        borderRadius: 10,
        background: selected ? '#f0fdfa' : disabled ? '#f9fafb' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={value}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(value)}
        style={{ marginTop: 3, accentColor: '#0f766e' }}
      />
      <span>
        <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem' }}>{title}</span>
        <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>{description}</span>
      </span>
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.875rem',
        color: '#4b5563',
        marginBottom: '0.5rem',
      }}
    >
      <span>{label}</span>
      <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const inputStyle = (hasError) => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.6rem 0.8rem',
  border: `1px solid ${hasError ? '#fca5a5' : '#d1d5db'}`,
  borderRadius: 8,
  fontSize: '0.9rem',
  color: '#111827',
  background: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
});
