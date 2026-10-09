// app/dashboard/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://video-generator-backend-634072894074.us-west2.run.app';

const NICHES = [
  '',
  'Personal finance',
  'Fitness',
  'Tech & AI',
  'Motivation',
  'Cooking',
  'Business',
  'Real estate',
  'History facts',
  'Custom',
];

const TONES = [
  'punchy and direct',
  'energetic and casual',
  'calm and informative',
  'dramatic',
];

// Friendly labels for the backend's job statuses
const STATUS_LABELS: Record<string, string> = {
  pending: 'Queued',
  generating_script: 'Writing script',
  fetching_footage: 'Creating visuals',
  generating_marketing: 'Writing marketing copy & thumbnails',
  generating_voiceover: 'Recording voiceover',
  assembling_video: 'Assembling video',
  done: 'Done',
  failed: 'Failed',
};

type Result = {
  videoUrl: string;
  marketing: any;
  thumbnails: string[];
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const isUpgraded = searchParams.get('upgraded') === '1';

  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [duration, setDuration] = useState(30);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const finalNiche = niche === 'Custom' ? customNiche.trim() : niche;

  const startGeneration = async () => {
    setError(null);
    if (!email.trim()) return setError('Please enter your email.');
    if (!topic.trim()) return setError('Please enter a video topic.');

    setLoading(true);
    setResult(null);
    setJobStatus('pending');

    try {
      const res = await fetch(`${BACKEND_URL}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          email: email.trim(),
          niche: finalNiche,
          tone,
          duration_seconds: duration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 402 = monthly limit reached, 400 = bad input
        setError(typeof data.detail === 'string' ? data.detail : 'Something went wrong. Please try again.');
        setLoading(false);
        setJobStatus(null);
        return;
      }

      setJobId(data.job_id);
    } catch (err) {
      console.error(err);
      setError('Could not reach the server. Please try again.');
      setLoading(false);
      setJobStatus(null);
    }
  };

  // Poll the job every 3 seconds until it's done or failed
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/jobs/${jobId}`);
        const data = await res.json();
        setJobStatus(data.status);

        if (data.status === 'done') {
          clearInterval(interval);

          const [marketing, thumbPaths] = await Promise.all([
            fetch(`${BACKEND_URL}/jobs/${jobId}/marketing`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null),
            fetch(`${BACKEND_URL}/jobs/${jobId}/thumbnails`)
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => []),
          ]);

          setResult({
            // The video endpoint streams the file, so point the player straight at it
            videoUrl: `${BACKEND_URL}/jobs/${jobId}/video`,
            marketing,
            thumbnails: (thumbPaths as string[]).map((p) => `${BACKEND_URL}${p}`),
          });
          setLoading(false);
          setJobId(null);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError(data.error || 'Video generation failed. Please try again.');
          setLoading(false);
          setJobId(null);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  const statusLabel = jobStatus ? STATUS_LABELS[jobStatus] || jobStatus : '';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {isUpgraded && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
          ✓ Account upgraded successfully! Your new monthly video limit is active.
        </div>
      )}

      <h1 className="text-2xl font-bold text-black">AI Video Studio</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium block text-gray-700">Email address</label>
        <input
          type="email"
          className="w-full p-2 border border-gray-300 rounded-lg text-black bg-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block text-gray-700">Niche</label>
        <select
          className="w-full p-2 border border-gray-300 rounded-lg text-black bg-white"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
        >
          {NICHES.map((n) => (
            <option key={n} value={n}>
              {n === '' ? 'No niche (general)' : n}
            </option>
          ))}
        </select>
        {niche === 'Custom' && (
          <input
            className="w-full p-2 border border-gray-300 rounded-lg text-black bg-white"
            value={customNiche}
            onChange={(e) => setCustomNiche(e.target.value)}
            placeholder="e.g. dog training"
            maxLength={60}
          />
        )}
        <p className="text-xs text-gray-500">
          We study the top Shorts in your niche so your script follows what's already working.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block text-gray-700">Video topic</label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] text-black bg-white"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. 3 money mistakes people make in their 20s"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium block text-gray-700">Tone</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg text-black bg-white capitalize"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            {TONES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium block text-gray-700">Length (seconds)</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-lg text-black bg-white"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {[15, 30, 45, 60].map((d) => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={startGeneration}
        disabled={loading}
        className="w-full bg-black text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400"
      >
        {loading ? `Processing: ${statusLabel || 'Starting...'}` : 'Generate Video'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && jobStatus && (
        <div className="p-4 border border-dashed rounded-lg text-center bg-gray-50 animate-pulse text-gray-600">
          <p className="text-sm">
            Current step: <strong>{statusLabel}</strong>
          </p>
          <p className="text-xs mt-1">This usually takes 2–4 minutes.</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 border-t pt-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-black">Your video</h2>
            <video controls src={result.videoUrl} className="w-full rounded-lg shadow-md bg-black" />
            <a
              href={result.videoUrl}
              className="inline-block text-sm font-medium text-blue-600 underline"
            >
              Download .mp4
            </a>
          </div>

          {result.thumbnails.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-gray-800">Thumbnail options</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {result.thumbnails.map((src, i) => (
                  <a key={src} href={src} title="Download thumbnail">
                    <img
                      src={src}
                      alt={`Thumbnail option ${i + 1}`}
                      className="w-full rounded-lg border shadow-sm"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {result.marketing && (
            <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
              <h3 className="font-bold text-gray-800">Marketing copy</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {typeof result.marketing === 'string'
                  ? result.marketing
                  : JSON.stringify(result.marketing, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-6 text-center text-gray-500 animate-pulse">
          Loading Video Studio...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
