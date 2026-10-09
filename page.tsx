// app/dashboard/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// 1. Move your main logic inside a clean sub-component wrapper
function DashboardContent() {
  const searchParams = useSearchParams();
  const isUpgraded = searchParams.get('upgraded') === '1';

  const [prompt, setPrompt] = useState('');
  const [email, setEmail] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://video-generator-backend-634072894074.us-west2.run.app';

  const startGeneration = async () => {
    if (!prompt) return alert('Please enter a prompt');
    
    setLoading(true);
    setVideoData(null);
    setJobStatus('Queued');
    
    try {
      const res = await fetch(`${BACKEND_URL}/generate-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, email: email || 'guest@example.com' }),
      });
      
      const data = await res.json();
      if (data.job_id) {
        setJobId(data.job_id);
      } else {
        setLoading(false);
        setJobStatus('Failed');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setJobStatus('Failed');
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/jobs/${jobId}`);
        const data = await res.json();
        
        setJobStatus(data.status);

        if (data.status === 'completed' || data.status === 'Done') {
          const videoRes = await fetch(`${BACKEND_URL}/jobs/${jobId}/video`);
          const marketingRes = await fetch(`${BACKEND_URL}/jobs/${jobId}/marketing`);
          const marketingData = await marketingRes.json();
          
          setVideoData({
            video_url: videoRes.url,
            marketing: marketingData,
          });
          
          setLoading(false);
          setJobId(null);
          clearInterval(interval);
        } else if (data.status === 'failed' || data.status === 'Failed') {
          setLoading(false);
          setJobId(null);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, BACKEND_URL]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {isUpgraded && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium">
          ✓ Account upgraded successfully! Enjoy increased generation video limits.
        </div>
      )}

      <h1 className="text-2xl font-bold text-black">AI Video Studio</h1>
      
      <div className="space-y-2">
        <label className="text-sm font-medium block text-gray-700">Email Address</label>
        <input 
          type="email"
          className="w-full p-2 border border-gray-300 rounded-lg text-black bg-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block text-gray-700">Video Prompt</label>
        <textarea 
          className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px] text-black bg-white"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your video topic or target niche..."
        />
      </div>
      
      <button 
        onClick={startGeneration} 
        disabled={loading}
        className="w-full bg-black text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400"
      >
        {loading ? `Processing: ${jobStatus || 'Assembling Video...'}` : 'Generate Video'}
      </button>

      {loading && jobStatus && (
        <div className="p-4 border border-dashed rounded-lg text-center bg-gray-50 animate-pulse text-gray-600">
          <p className="text-sm">Current Phase: <strong className="capitalize">{jobStatus}</strong></p>
        </div>
      )}

      {videoData && (
        <div className="mt-8 space-y-6 border-t pt-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-black">Your Generated Video</h2>
            <video controls src={videoData.video_url} className="w-full rounded-lg shadow-md bg-black" />
          </div>

          {videoData.marketing && (
            <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
              <h3 className="font-bold text-gray-800">Generated Marketing Copy</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{videoData.marketing.copy || JSON.stringify(videoData.marketing)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 2. Export the main component wrapped cleanly inside a Suspense boundary fallback skeleton
export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto p-6 text-center text-gray-500 animate-pulse">
        Loading Video Studio Dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
