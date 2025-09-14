import { error } from '@sveltejs/kit';
import path from 'node:path';
import fs from 'node:fs';
import type { RequestHandler } from './$types';

// This should be a private directory at the root of your project
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export const GET: RequestHandler = ({ params }) => {
	const requestedPath = params.filepath;

	// Basic security: prevent path traversal
	if (requestedPath.includes('..')) {
		throw error(403, 'Forbidden');
	}

	const filePath = path.join(UPLOADS_DIR, requestedPath);

	if (fs.existsSync(filePath)) {
		const fileStream = fs.createReadStream(filePath);
		return new Response(fileStream, {
			headers: {
				// This is a generic header. For production, you might want a more specific
				// content-type based on the file extension (e.g., 'application/pdf').
				'Content-Type': 'application/octet-stream'
			}
		});
	}

	throw error(404, 'Not Found');
};