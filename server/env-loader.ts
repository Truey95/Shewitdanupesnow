
import fs from 'fs';
import path from 'path';

console.log("Loading environment variables...");

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    let loadedCount = 0;
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2] ? match[2].trim() : '';

            // Remove quotes if present
            if (value.length > 0 && (value.startsWith('"') || value.startsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }

            if (!process.env[key]) {
                process.env[key] = value;
                loadedCount++;
            }
        }
    });
    console.log(`Loaded ${loadedCount} environment variables from .env`);
} else {
    console.log(".env file not found");
}
