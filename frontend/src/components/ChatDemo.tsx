import React, { useState } from 'react';

export default function ChatDemo() {
  const [appId, setAppId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const handleConfigure = () => {
    if (appId.trim()) {
      // In a real app, you'd save this to environment variables
      // For demo purposes, we'll just store it in localStorage
      localStorage.setItem('demo_sendbird_app_id', appId.trim());
      setIsConfigured(true);
    }
  };

  const checkConfiguration = () => {
    const storedAppId = localStorage.getItem('demo_sendbird_app_id');
    if (storedAppId) {
      setAppId(storedAppId);
      setIsConfigured(true);
    }
  };

  React.useEffect(() => {
    checkConfiguration();
  }, []);

  if (!isConfigured) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Sendbird Chat Setup</h2>
        <p className="text-gray-600 mb-4">
          To test the chat functionality, you need to configure your Sendbird App ID.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="appId" className="block text-sm font-medium text-gray-700 mb-2">
              Sendbird App ID
            </label>
            <input
              type="text"
              id="appId"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Enter your Sendbird App ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleConfigure}
            disabled={!appId.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Configure Chat
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-900 mb-2">How to get your App ID:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Go to <a href="https://dashboard.sendbird.com" target="_blank" rel="noopener noreferrer" className="underline">Sendbird Dashboard</a></li>
            <li>2. Sign up or log in to your account</li>
            <li>3. Create a new application or select existing one</li>
            <li>4. Copy the Application ID from the dashboard</li>
            <li>5. Paste it in the field above</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Chat Configured!</h2>
        <p className="text-gray-600 mb-4">
          Your Sendbird App ID is configured. You can now test the chat functionality in your video calls.
        </p>
        
        <div className="bg-gray-50 p-3 rounded-md mb-4">
          <p className="text-sm text-gray-700">
            <strong>App ID:</strong> {appId}
          </p>
        </div>
        
        <button
          onClick={() => {
            localStorage.removeItem('demo_sendbird_app_id');
            setIsConfigured(false);
            setAppId('');
          }}
          className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
        >
          Reset Configuration
        </button>
      </div>
    </div>
  );
}
