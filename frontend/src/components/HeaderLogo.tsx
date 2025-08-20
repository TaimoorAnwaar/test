import React from 'react';

export default function HeaderLogo() {
  return (
    <div className="flex items-center">
      <div className="flex-shrink-0">
        {/* Logo Icon */}
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
      </div>
      
      {/* Logo Text */}
      <div className="ml-3">
        <h1 className="text-xl font-bold text-gray-900">Logo</h1>
        <p className="text-sm text-gray-500">Tagline</p>
      </div>
    </div>
  );
}
