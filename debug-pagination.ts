
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env');
try {
    const envFileContent = fs.readFileSync(envPath, 'utf-8');
    envFileContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const val = valueParts.join('=').trim();
            // remove quotes if present
            process.env[key.trim()] = val.replace(/^["'](.*)["']$/, '$1');
        }
    });
} catch (e) {
    console.log("Could not read .env file");
}

const API_KEY = process.env.PRINTIFY_API_KEY;

if (!API_KEY) {
    console.error('CRITICAL: PRINTIFY_API_KEY not found in .env');
    process.exit(1);
}

async function checkPagination() {
    try {
        console.log('Authenticating with key ending in...', API_KEY.slice(-5));

        // 1. Get Shop
        const shopsRes = await fetch('https://api.printify.com/v1/shops.json', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!shopsRes.ok) throw new Error(`Shops fetch failed: ${shopsRes.statusText}`);
        const shops: any = await shopsRes.json();
        const shopId = shops[0]?.id;

        if (!shopId) {
            console.log('No shops found.');
            return;
        }

        console.log(`Fetching products for shop ${shopId}...`);

        // 2. Get Products (Limit 10 to force pagination if applicable)
        const productsRes = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=10`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });

        if (!productsRes.ok) throw new Error(`Products fetch failed: ${productsRes.statusText}`);

        const response: any = await productsRes.json();

        console.log('--- Response Analysis ---');
        console.log('Is Array?', Array.isArray(response));

        let data = response;
        if (response.data) {
            console.log('Has .data property (Laravel style pagination)');
            data = response.data;
            console.log('Total:', response.total);
            console.log('Per Page:', response.per_page);
            console.log('Current Page:', response.current_page);
            console.log('Last Page:', response.last_page);
            console.log('Next Page URL:', response.next_page_url);
        } else {
            console.log('No .data property. Checking returned array length...');
            console.log('Length:', response.length);

            // Check link header
            const linkHeader = productsRes.headers.get('link');
            console.log('Link Header:', linkHeader);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkPagination();
