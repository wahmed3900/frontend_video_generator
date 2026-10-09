'use client';
import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://your-python-backend.run.app';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    videos: 3,
    features: ['3 videos / month', 'AI-generated visuals', 'Voiceover included', 'Marketing copy'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$19',
    period: 'per month',
    videos: 10,
    features: ['10 videos / month', 'AI-generated visuals', 'Voiceover included', 'Marketing copy', 'Thumbnail options'],
    cta: 'Upgrade to Starter',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$40',
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
        <h1 className="text-4xl font-extrabold">Simple Pricing</h1>
        <p className="text-gray-500 text-lg">Start free. Upgrade when you need more.</p>
      </div>

      {/* Email input (needed before checkout) */}
      <div className="max-w-sm mx-auto">
        <input
          type="email"
          className="w-full p-3 border rounded-lg text-sm"
          placeholder="your@email.com — needed to upgrade"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-8 flex flex-col gap-6 ${
              plan.highlight ? 'border-black shadow-lg' : 'border-gray-200'
            }`}
          >
            {plan.highlight && (
              <span className="text-xs font-semibold uppercase tracking-wider bg-black text-white px-3 py-1 rounded-full self-start">
                Most Popular
              </span>
            )}
            <div>
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="mt-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
              </p>
              <p className="text-gray-500 text-sm mt-1">{plan.videos} videos / month</p>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map(f => (
                <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => checkout(plan.id)}
              disabled={loading === plan.id}
              className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                plan.highlight
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'border border-gray-300 hover:bg-gray-50'
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
