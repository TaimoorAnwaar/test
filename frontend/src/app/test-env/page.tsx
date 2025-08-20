"use client";

import React from 'react';

export default function TestEnvPage() {
  const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID;
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Environment Variables Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Sendbird Configuration</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">App ID:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  appId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {appId || 'NOT FOUND'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  appId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {appId ? '✅ Configured' : '❌ Missing'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Environment Check</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>Next.js Public Runtime Config:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
            <div className="space-y-2 text-sm text-gray-600">
              {!appId ? (
                <>
                  <p>❌ <strong>Problem:</strong> Sendbird App ID not found</p>
                  <p><strong>Solution:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Check your <code className="bg-gray-200 px-1 rounded">.env.local</code> file</li>
                    <li>Ensure it contains: <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_SENDBIRD_APP_ID=AEF374AE-A965-4953-9910-CB097C8E9CC5</code></li>
                    <li>Restart your development server</li>
                    <li>Clear browser cache</li>
                  </ol>
                </>
              ) : (
                <>
                  <p>✅ <strong>Status:</strong> Sendbird App ID is configured</p>
                  <p><strong>Next Steps:</strong></p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Test the chat in a video call</li>
                    <li>Check browser console for connection logs</li>
                    <li>Verify Sendbird dashboard settings</li>
                  </ol>
                </>
              )}
            </div>
          </div>
          
          <div className="pt-4">
            <a 
              href="/" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
