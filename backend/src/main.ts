import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	// Load env for AGORA_APP_ID/AGORA_APP_CERTIFICATE and FRONTEND_BASE_URL
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('dotenv').config();
	
	// Debug environment variables
	// cone.log('Environment variables loaded:', {
	//   AG_APP_ID: process.env.AGORA_APP_ID ? 'present' : 'missing',
	//   AGOAPP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE ? 'present' : 'missing',
	//https://46ff48d8b202.ngrok-free.appTEND_BASE_URL,
	//   PORT:ocess.env.PORT,
	//   NODE_E process.env.NODE_ENV
	// });
	
	const app = await NestFactory.create(AppModule);
	const defaultOrigins = [
		process.env.FRONTEND_BASE_URL || 'http://localhost:3001',
		'http://localhost:3000',
		'http://127.0.0.1:3001',
		'http://10.1.0.239:3001',
		'https://7e424a852e33.ngrok-free.app',
	];
	const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

	app.enableCors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.includes(origin)) return callback(null, true);
			// In non-production allow typical LAN origins like http://192.168.x.x:3001 or http://10.x.x.x:3001
			const isLan = /^http:\/\/(10\.|172\.(1[6-9]|2\d|3[0-1])|192\.168\.)\d+\.\d+:(3000|3001)$/.test(
				origin,
			);
			if (process.env.NODE_ENV !== 'production' && isLan) return callback(null, true);
			return callback(new Error(`Not allowed by CORS: ${origin}`), false);
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
	});
	const port = Number(process.env.PORT) || 3000;
	const host = process.env.HOST || '0.0.0.0';
	await app.listen(port, host);
	console.log(`🚀 Backend listening on http://${host}:${port}`);
}
bootstrap();
