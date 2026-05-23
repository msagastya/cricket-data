'use client';

/**
 * Upload Page - BULK UPLOAD SUPPORT
 *
 * Admin interface for uploading Cricsheet match files
 * Features: Multiple file upload, progress tracking, upload history
 */

import { useState, useCallback, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, FileText, Loader2, Trash2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface UploadResult {
  success: boolean;
  upload_id?: string;
  match_id?: string;
  match_info?: {
    date: string;
    teams: string[];
    venue: string;
    format: string;
  };
  stats?: {
    deliveries: number;
    innings: number;
    players_updated: number;
  };
  warnings?: string[];
  error?: string;
  details?: any;
}

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResult;
  progress?: number;
}

interface UploadHistory {
  filename: string;
  status: 'success' | 'error';
  result?: UploadResult;
  timestamp: Date;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileUploadStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<UploadHistory[]>([]);

  // Load upload history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('upload_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      } catch (error) {
        console.error('Failed to load upload history:', error);
      }
    }
  }, []);

  // Save upload history to localStorage
  const saveHistory = (newHistory: UploadHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem('upload_history', JSON.stringify(newHistory));
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Handle file selection
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  // Validate and add files
  const handleFiles = (newFiles: File[]) => {
    const validFiles: FileUploadStatus[] = [];

    for (const file of newFiles) {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (!['json', 'yaml', 'yml'].includes(extension || '')) {
        alert(`Skipped ${file.name}: Invalid file type (only .json, .yaml, .yml accepted)`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`Skipped ${file.name}: File too large (max 10MB)`);
        continue;
      }

      validFiles.push({
        file,
        status: 'pending',
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  // Remove file from queue
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload all files
  const uploadAllFiles = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      // Mark as uploading
      setFiles((prev) => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'uploading' };
        return updated;
      });

      try {
        const formData = new FormData();
        formData.append('file', files[i].file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          // Mark as success
          setFiles((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              status: 'success',
              result: data,
            };
            return updated;
          });

          // Add to history
          const newHistory: UploadHistory[] = [
            {
              filename: files[i].file.name,
              status: 'success',
              result: data,
              timestamp: new Date(),
            },
            ...history.slice(0, 19),
          ];
          saveHistory(newHistory);
        } else {
          // Mark as error
          setFiles((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              status: 'error',
              result: {
                success: false,
                error: data.error || 'Upload failed',
                details: data.details || data.errors,
              },
            };
            return updated;
          });

          // Add to history
          const newHistory: UploadHistory[] = [
            {
              filename: files[i].file.name,
              status: 'error',
              result: {
                success: false,
                error: data.error,
                details: data.details,
              },
              timestamp: new Date(),
            },
            ...history.slice(0, 19),
          ];
          saveHistory(newHistory);
        }
      } catch (error) {
        // Mark as error
        setFiles((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'error',
            result: {
              success: false,
              error: 'Network error',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
          };
          return updated;
        });
      }

      // Small delay between uploads
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setUploading(false);
  };

  // Clear completed
  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status === 'pending' || f.status === 'uploading'));
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Upload Cricket Data</h1>
          <p className="text-slate-600">
            Upload single or multiple Cricsheet files (JSON, YAML)
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }
            `}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload
              className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}
              size={48}
            />

            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </h3>

            <p className="text-slate-600 mb-4">or</p>

            <label className="inline-block">
              <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                Choose Files
              </span>
              <input
                type="file"
                className="hidden"
                accept=".json,.yaml,.yml"
                onChange={handleFileInput}
                multiple
              />
            </label>

            <p className="text-sm text-slate-500 mt-4">
              Accepts .json, .yaml, or .yml files (max 10MB each)
            </p>
          </div>

          {/* File Queue */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">
                  Files ({files.length})
                  {pendingCount > 0 && <span className="text-slate-500 ml-2">• {pendingCount} pending</span>}
                  {successCount > 0 && <span className="text-green-600 ml-2">• {successCount} uploaded</span>}
                  {errorCount > 0 && <span className="text-red-600 ml-2">• {errorCount} failed</span>}
                </h3>

                <div className="flex gap-2">
                  {(successCount > 0 || errorCount > 0) && (
                    <button
                      onClick={clearCompleted}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      Clear Completed
                    </button>
                  )}

                  {pendingCount > 0 && (
                    <button
                      onClick={uploadAllFiles}
                      disabled={uploading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          Upload All ({pendingCount})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.map((fileStatus, index) => (
                  <div
                    key={index}
                    className="p-4 border border-slate-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {fileStatus.status === 'pending' && (
                        <FileText className="text-slate-400 flex-shrink-0" size={24} />
                      )}
                      {fileStatus.status === 'uploading' && (
                        <Loader2 className="text-blue-600 flex-shrink-0 animate-spin" size={24} />
                      )}
                      {fileStatus.status === 'success' && (
                        <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                      )}
                      {fileStatus.status === 'error' && (
                        <XCircle className="text-red-600 flex-shrink-0" size={24} />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {fileStatus.file.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {(fileStatus.file.size / 1024).toFixed(2)} KB
                        </p>

                        {fileStatus.result?.match_info && (
                          <p className="text-sm text-green-600 mt-1">
                            {fileStatus.result.match_info.teams.join(' vs ')} •{' '}
                            {fileStatus.result.match_info.venue}
                          </p>
                        )}

                        {fileStatus.result?.error && (
                          <p className="text-sm text-red-600 mt-1 truncate">
                            {fileStatus.result.error}
                          </p>
                        )}
                      </div>

                      {fileStatus.status === 'pending' && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                          title="Remove file"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Uploads</h2>

            <div className="space-y-3">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {item.status === 'success' ? (
                        <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                      ) : (
                        <XCircle className="text-red-600 flex-shrink-0" size={20} />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{item.filename}</p>

                        {item.result?.match_info && (
                          <p className="text-sm text-slate-600 truncate">
                            {item.result.match_info.teams.join(' vs ')} •{' '}
                            {item.result.match_info.venue}
                          </p>
                        )}

                        {item.result?.error && (
                          <p className="text-sm text-red-600 truncate">{item.result.error}</p>
                        )}
                      </div>

                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <button
                onClick={() => saveHistory([])}
                className="mt-4 text-sm text-red-600 hover:text-red-700"
              >
                Clear History
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
