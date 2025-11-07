import { useState } from 'react';
import { useGenerate, useGenerations } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import type { Generation } from '../lib/api';

export default function Studio() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');

  const { logout } = useAuth();
  const generate = useGenerate();
  const { data: generations, isLoading } = useGenerations();

  const handleGenerate = async () => {
    if (!prompt.trim() || !style.trim()) {
      return;
    }

    generate.mutate({
      prompt: prompt.trim(),
      style: style.trim(),
      image: selectedFile || undefined,
    });
  };

  const handleRestore = (generation: Generation) => {
    setPrompt(generation.prompt);
    setStyle(generation.style);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Fashion AI Studio</h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Generation Form */}
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-xl font-semibold">Create New Generation</h2>

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full border rounded px-3 py-2"
              />
              {selectedFile && (
                <p className="text-sm text-slate-600 mt-1">Selected: {selectedFile.name}</p>
              )}
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Describe the fashion item you want to generate..."
                rows={4}
                required
              />
            </div>

            {/* Style Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Style</label>
              <input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., modern, vintage, casual..."
                required
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generate.isPending || !prompt.trim() || !style.trim()}
              className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {generate.isPending ? 'Generating...' : 'Generate'}
            </button>

            {generate.isRetrying && (
              <p className="text-sm text-amber-600">
                Retry attempt {generate.attempt} of 3 — the service is rate limiting, please hold on…
              </p>
            )}

            {generate.isError && (
              <p className="text-red-500 text-sm">
                {generate.error instanceof Error
                  ? generate.error.message
                  : 'Generation failed'}
              </p>
            )}
          </div>

          {/* Right Column: Recent Generations */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>

            {isLoading ? (
              <p className="text-slate-500">Loading...</p>
            ) : !generations || generations.length === 0 ? (
              <p className="text-slate-500">No generations yet. Create your first one!</p>
            ) : (
              <div className="space-y-4">
                {generations.map((generation) => (
                  <div
                    key={generation.id}
                    className="border rounded p-4 space-y-2 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{generation.prompt}</p>
                        <p className="text-sm text-slate-600">Style: {generation.style}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(generation.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestore(generation)}
                        className="px-3 py-1 text-sm bg-slate-200 rounded hover:bg-slate-300"
                      >
                        Restore
                      </button>
                    </div>
                    {generation.imageUrl && (
                      <img
                        src={`http://localhost:4000${generation.imageUrl}`}
                        alt={generation.prompt}
                        className="w-full rounded mt-2"
                      />
                    )}
                    <div className="text-xs">
                      <span
                        className={`px-2 py-1 rounded ${
                          generation.status === 'succeeded'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {generation.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
