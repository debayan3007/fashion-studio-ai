import { useMemo, useRef, useState } from 'react';
import { useGenerate, useGenerations } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import type { Generation } from '../lib/api';

const STYLES = [
  'realistic',
  'watercolor',
  'sketch',
  'anime',
  'editorial',
] as const;

function toTitleCase(value: string): string {
  return value.toUpperCase();
}

export default function Studio() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { logout } = useAuth();
  const generate = useGenerate();
  const { data: generations, isLoading } = useGenerations();
  const styleOptions = useMemo(
    () => STYLES.map((option) => ({ label: toTitleCase(option), value: option })),
    [],
  );


  const handleGenerate = async () => {
    if (!prompt.trim() || !style.trim()) {
      return;
    }

    const trimmedPrompt = prompt.trim();
    const trimmedStyle = style.trim();

    generate.mutate(
      {
        prompt: trimmedPrompt,
        style: trimmedStyle,
        image: selectedFile || undefined,
      },
      {
        onSuccess: () => {
          setPrompt('');
          setStyle('');
          setSelectedFile(null);
          setPreviewUrl(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      },
    );
  };

  const handleRestore = (generation: Generation) => {
    setPrompt(generation.prompt);
    setStyle(generation.style);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(generation.imageUrl ? `http://localhost:4000${generation.imageUrl}` : null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Fashion AI Studio</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300 transition-colors"
            >
              Logout
            </button>
          </div>
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
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
                className="w-full border rounded px-3 py-2"
              />
              {(selectedFile || previewUrl) && (
                <div className="mt-2 space-y-2">
                  {selectedFile && (
                    <p className="text-sm text-slate-600">Selected: {selectedFile.name}</p>
                  )}
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview of uploaded file"
                      className="h-32 w-32 rounded object-cover border"
                    />
                  )}
                </div>
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
              <label className="block text-sm font-medium mb-2" htmlFor="style-select">
                Style
              </label>
              <select
                id="style-select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="" disabled>
                  Select a style
                </option>
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-2">
              <button
                onClick={handleGenerate}
                disabled={generate.isPending || !prompt.trim() || !style.trim()}
                className="w-full sm:w-auto flex-1 bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generate.isPending && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                )}
                <span>{generate.isPending ? 'Generating...' : 'Generate'}</span>
              </button>

              {generate.isPending && (
                <button
                  type="button"
                  onClick={generate.cancel}
                  className="w-full sm:w-auto flex-none border border-rose-200 text-rose-600 h-10 aspect-square rounded hover:bg-rose-50 flex items-center justify-center"
                  title="Stop generating"
                >
                  <span className="inline-flex h-3 w-3 items-center justify-center" aria-hidden="true">
                    <span className="block h-full w-full rounded-sm bg-rose-500" aria-hidden="true" />
                  </span>
                </button>
              )}
            </div>

            {generate.isRetrying && (
              <p className="text-sm text-amber-600">
                Retry attempt {generate.attempt} of 3 — the service is rate limiting, please hold on…
              </p>
            )}

            {generate.isOutOfRetries && !generate.isPending && (
              <p role="alert" className="text-sm text-rose-600">
                We hit the retry limit because of rate limiting. Please wait a moment before trying again.
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
                    className="border rounded p-4 space-y-2 hover:bg-slate-50 transition-colors"
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
                        className="px-3 py-1 text-sm bg-slate-200 rounded hover:bg-slate-300 transition-colors"
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
