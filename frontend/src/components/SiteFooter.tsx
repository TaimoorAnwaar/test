import React from 'react';

export default function SiteFooter() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Marham Logo */}
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-white">Marham</h3>
          </div>
          
          {/* Copyright */}
          <div className="text-center">
            <p className="text-gray-400">&copy; 2024 Marham. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
