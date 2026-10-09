'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://video-generator-backend-634072894074.us-west2.run.app';

const STATUS_LABELS: Record<string, string> = {
  pending:               'Queued…',
  generating_script:     'Writing script…',
  fetching_footage:      'Generating visuals…',
  generating_marketing:  'Creating marketing copy…',
  generating_voiceover:  'Recording voiceover…',
  assembling_video:      'Assembling video…',
  done:                  'Done!',
  failed:                'Failed',
};

interface MarketingCopy {
  title?: string;
  description?: string;
  hashtags?: string[];
  [key: string]: unknown;
}

function DashboardContent() {
  const searchParams  = useSearchParams();
  const justUpgraded  = searchParams.get('upgraded') === '1';

  const [email, setEmail]         = useState('');
  const [prompt, setPrompt]       = useState('');
  const [niche, setNiche]         = useState('');
  const [jobId, setJobId]         = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [marketing, setMarketing] = useState<MarketingCopy | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [limitHit, setLimitHit]   = useState(false);

  // ── start generation ───────────────────────────────────────────────────
  const startGeneration = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!prompt.trim()) { setError('Please enter a video topic.'); return; }

    setLoading(true);
    setError(null);
    setLimitHit(false);
    setJobId(null);
    setJobStatus('pending');
    setMarketing(null);
    setThumbnails([]);

    try {
      const res = await fetch(`${API_BASE}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:            prompt.trim(),   // ✅ correct field name
          duration_seconds: 60,
          tone:             'punchy and direct',
          email:            email.trim().toLowerCase(),
          niche:            niche.trim(),
        }),
      });

      if (res.status === 402) {
        setLimitHit(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? 'Failed to start generation.');
      }

      const data = await res.json();
      setJobId(data.job_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLoading(false);
    }
  };

  // ── poll status every 3 s ──────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;
    if (jobStatus === 'done' || jobStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        setJobStatus(data.status);  // ✅ lowercase from your enum

        if (data.status === 'done') {
          setLoading(false);
          clearInterval(interval);
          fetchExtras(jobId);
        } else if (data.status === 'failed') {
          setError(data.error ?? 'Generation failed.');
          setLoading(false);
          clearInterval(interval);
        }
      } catch {
        // network blip — keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  // ── fetch marketing + thumbnails after done ────────────────────────────
  const fetchExtras = async (id: string) => {
    try {
      const mRes = await fetch(`${API_BASE}/jobs/${id}/marketing`);
      if (mRes.ok) setMarketing(await mRes.json());
    } catch { /* non-fatal */ }

    try {
      const tRes = await fetch(`${API_BASE}/jobs/${id}/thumbnails`);
      if (tRes.ok) {
        const paths: string[] = await tRes.json();
        // ✅ convert relative paths → full URLs (no fetch needed, browser streams directly)
        setThumbnails(paths.map(p => `${API_BASE}${p}`));
      }
    } catch { /* non-fatal */ }
  };

  const isDone      = jobStatus === 'done';
  const isFailed    = jobStatus === 'failed';
  // ✅ video URL points directly at the endpoint — browser streams it, no fetch needed
  const videoUrl    = isDone && jobId ? `${API_BASE}/jobs/${jobId}/video` : null;
  const statusLabel = jobStatus ? (STATUS_LABELS[jobStatus] ?? jobStatus) : null;

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-black">AI Video Studio</h1>

      {justUpgraded && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
          🎉 Upgrade successful! You now have more videos this month.
        </div>
      )}

      {/* Email */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:border-black"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={loading}
        />
      </div>

      {/* Topic */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Video Topic</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black min-h-[100px] focus:outline-none focus:border-black"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter your video topic or target niche…"
          disabled={loading}
        />
      </div>

      {/* Niche (optional) */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Niche <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:border-black"
          value={niche}
          onChange={e => setNiche(e.target.value)}
          placeholder="e.g. personal finance, fitness, tech & ai"
          disabled={loading}
        />
      </div>

      {/* Generate button */}
      <button
        onClick={startGeneration}
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold disabled:bg-gray-400 transition-colors"
      >
        {loading ? (statusLabel ?? 'Working…') : 'Generate Video'}
      </button>

      {/* Status pulse */}
      {loading && statusLabel && (
        <div className="p-4 border border-dashed rounded-lg text-center bg-gray-50 animate-pulse text-gray-600">
          <p className="text-sm">Current phase: <strong className="capitalize">{statusLabel}</strong></p>
        </div>
      )}

      {/* Generic error */}
      {error && !limitHit && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {/* Plan limit upgrade CTA */}
      {limitHit && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-xl p-5 space-y-3">
          <p className="font-semibold text-yellow-800">You've used all your free videos this month.</p>
          <p className="text-sm text-yellow-700">
            Upgrade to keep generating — Starter gets you 10/month, Pro gets you 30.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            View Pricing →
          </Link>
        </div>
      )}

      {/* Results */}
      {isDone && videoUrl && (
        <div className="mt-8 space-y-6 border-t pt-6">
          <h2 className="text-xl font-semibold text-black">Your Generated Video</h2>

          {/* ✅ src points directly at endpoint — browser streams it */}
          <video controls src={videoUrl} className="w-full rounded-lg shadow-md bg-black" />

          <a
            href={videoUrl}
            download="video.mp4"
            className="inline-block bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            ⬇ Download Video
          </a>

          {/* Thumbnails */}
          {thumbnails.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Thumbnails</h3>
              <div className="flex gap-3 flex-wrap">
                {thumbnails.map((url, i) => (
                  <a key={i} href={url} download={`thumbnail_${i + 1}.jpg`}>
                    <img
                      src={url}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-40 rounded-lg border hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Marketing copy */}
          {marketing && (
            <div className="p-4 bg-gray-50 border rounded-lg space-y-2">
              <h3 className="font-bold text-gray-800">Marketing Copy</h3>
              {marketing.title && (
                <p><span className="font-medium">Title:</span> {marketing.title}</p>
              )}
              {marketing.description && (
                <p className="text-sm text-gray-700">{marketing.description}</p>
              )}
              {marketing.hashtags && marketing.hashtags.length > 0 && (
                <p className="text-sm text-blue-600">
                  {marketing.hashtags.map(h => `#${h}`).join(' ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isFailed && (
        <p className="text-red-600 text-sm">
          Generation failed: {error ?? 'Unknown error'}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-6 text-center text-gray-500 animate-pulse">
        Loading Video Studio…
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
