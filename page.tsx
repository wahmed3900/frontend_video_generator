// app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [prompt, setPrompt] = useState('');
  const [email, setEmail] = useState(''); // Added to match backend history tracking
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Points to your Google Cloud Function or deployed backend URL
  const BACKEND_URL = 'https://cloudfunctions.net';

  const startGeneration = async () => {
    if (!prompt) return alert('Please enter a prompt');
    
    setLoading(true);
    setVideoData(null);
    setJobStatus('Queued');
    
    try {
      // Adjusted endpoint to match POST /generate-video
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

  // Poll job status every 3 seconds until completed or failed
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        // Adjusted endpoint to match GET /jobs/{job_id}
        const res = await fetch(`${BACKEND_URL}/jobs/${jobId}`);
        const data = await res.json();
        
        setJobStatus(data.status);

        if (data.status === 'completed' || data.status === 'Done') {
          // Fetch final assets
          const videoRes = await fetch(`${BACKEND_URL}/jobs/${jobId}/video`);
          const marketingRes = await fetch(`${BACKEND_URL}/jobs/${jobId}/marketing`);
          
          const marketingData = await marketingRes.json();
          
          setVideoData({
            video_url: videoRes.url, // Directly link the storage asset redirect
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
  }, [jobId]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI Video Studio</h1>
      
      <div className="space-y-2">
        <label className="text-sm font-medium block">Email Address</label>
        <input 
          type="email"
          className="w-full p-2 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium block">Video Prompt</label>
        <textarea 
          className="w-full p-3 border rounded-lg min-h-[100px]"
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

      {/* Real-time Status Updates */}
      {loading && jobStatus && (
        <div className="p-4 border border-dashed rounded-lg text-center bg-gray-50 animate-pulse">
          <p className="text-sm text-gray-600">Current Phase: <strong className="capitalize">{jobStatus}</strong></p>
        </div>
      )}

      {/* Finished Output Display */}
      {videoData && (
        <div className="mt-8 space-y-6 border-t pt-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Your Generated Video</h2>
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
