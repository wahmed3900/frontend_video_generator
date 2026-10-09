'use client';
import { useState } from 'react';

// FIXED: Aligned environment variable with your dashboard's .env definition
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://video-generator-backend-634072894074.us-west2.run.app';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '\$0',
    period: 'forever',
    videos: 3,
    features: ['3 videos / month', 'AI-generated visuals', 'Voiceover included', 'Marketing copy'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '\$19',
    period: 'per month',
    videos: 10,
    features: ['10 videos / month', 'AI-generated visuals', 'Voiceover included', 'Marketing copy', 'Thumbnail options'],
    cta: 'Upgrade to Starter',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '\$40',
    period: 'per month',
    videos: 30,
    features: ['30 videos / month', 'AI-generated visuals', 'Voiceover included', 'Marketing copy', 'Thumbnail options', 'Priority processing'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
];

export default function PricingPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const checkout = async (planId: string) => {
    if (planId === 'free') {
      window.location.href = '/dashboard';
      return;
    }
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setError(null);
    setLoading(planId);
    try {
      // Makes a call to your Python server's checkout generation handler
      const res = await fetch(`${API_BASE}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          plan: planId,
          success_url: `${window.location.origin}/dashboard?upgraded=1`,
          cancel_url:  `${window.location.origin}/pricing`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? 'Checkout failed.');
      }
      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-black">Simple Pricing</h1>
        <p className="text-gray-500 text-lg">Start free. Upgrade when you need more.</p>
      </div>

      {/* Email input field */}
      <div className="max-w-sm mx-auto">
        <input
          type="email"
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
          placeholder="your@email.com — needed to upgrade"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Plan grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-8 flex flex-col gap-6 bg-white ${
              plan.highlight ? 'border-black shadow-lg ring-1 ring-black' : 'border-gray-200 shadow-sm'
            }`}
          >
            {plan.highlight && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-white px-3 py-1 rounded-full self-start">
                Most Popular
              </span>
            )}
            <div>
              <h2 className="text-xl font-bold text-black">{plan.name}</h2>
              <p className="mt-1">
                <span className="text-4xl font-extrabold text-black">{plan.price}</span>
                <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
              </p>
              <p className="text-gray-500 text-sm mt-1">{plan.videos} videos / month</p>
            </div>

            <ul className="space-y-3 flex-1">
              {plan.features.map(f => (
                <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500 font-bold text-xs">✓</span> {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => checkout(plan.id)}
              disabled={loading !== null}
              className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                plan.highlight
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-white border border-gray-300 text-black hover:bg-gray-50'
              }`}
            >
              {loading === plan.id ? 'Redirecting…' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
