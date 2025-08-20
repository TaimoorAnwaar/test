import React from 'react';

interface ConditionalFooterProps {
  showFooter: boolean;
}

export default function ConditionalFooter({ showFooter }: ConditionalFooterProps) {
  if (!showFooter) {
    return null;
  }

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p>&copy; 2024 Your App. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
