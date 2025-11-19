// src/app/admin/upload/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [statusLog, setStatusLog] = useState<string[]>(['Select one or more Cricsheet JSON files to upload.']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // A more robust way to handle client-side-only routing
  if (typeof window !== 'undefined' && !user) {
    router.push('/login');
    return null; // Render nothing while redirecting
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setFiles(selectedFiles);
      setStatusLog([`Selected ${selectedFiles.length} file(s).`]);
    }
  };
  
  const appendLog = (message: string) => {
    setStatusLog(prevLog => [...prevLog, message]);
  }

  const handleUpload = async () => {
    if (files.length === 0 || !user) {
      appendLog('Please select files and ensure you are logged in.');
      return;
    }

    setIsLoading(true);
    appendLog(`Starting upload of ${files.length} file(s)...`);

    for (const file of files) {
      try {
        const matchId = file.name.split('.')[0];
        appendLog(`Uploading ${file.name}...`);
        
        const fileContent = await file.text();
        const jsonData = JSON.parse(fileContent);
        const idToken = await user.getIdToken();

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ jsonData, matchId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed');
        }
        appendLog(`✅ Success: ${file.name} uploaded.`);

      } catch (error: any) {
        appendLog(`❌ Error uploading ${file.name}: ${error.message}`);
      }
    }
    
    appendLog('All uploads complete.');
    setIsLoading(false);
    setFiles([]); // Clear selection after upload
  };

  if (!user) {
    return (
      <div className="text-center mt-10">
        <p className="text-lg text-gray-400">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="w-full p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4">Admin: Bulk Upload Data</h1>
        <p className="text-gray-400 mb-6">You can select multiple files. Filenames must be the match ID (e.g., `1389389.json`).</p>

        <div className="mb-4">
          <input 
            type="file"
            accept=".json"
            multiple // Allow multiple file selection
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
            disabled={isLoading}
          />
        </div>

        <button 
          onClick={handleUpload} 
          disabled={files.length === 0 || isLoading}
          className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? `Uploading...` : `Upload ${files.length} File(s)`}
        </button>

        {statusLog.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-gray-900 border border-gray-700 h-64 overflow-y-auto">
            <h3 className="font-bold mb-2">Upload Log</h3>
            {statusLog.map((log, index) => (
              <p key={index} className="font-mono text-sm mb-1">{log}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}