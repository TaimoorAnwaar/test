import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Allow dev origins (e.g., ngrok) to load Next static/_next resources
	allowedDevOrigins: [
		// Add your ngrok domain(s) here during dev
		process.env.NGROK_URL || '',
	],
	async rewrites() {
		// Proxy API calls to backend so clients can use relative URLs
		const backendBase = process.env.BACKEND_INTERNAL_URL || 'http://localhost:3000';
		return [
			{ source: '/agora/:path*', destination: `${backendBase}/agora/:path*` },
		];
	},
};

export default nextConfig;
