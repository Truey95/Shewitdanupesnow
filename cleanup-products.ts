
import './server/env-loader.js';
import { db } from './db/index.js';
import { products } from './db/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function cleanupStaleProducts() {
    console.log('Starting cleanup of stale products...');

    // IDs observed to be broken in browser session: 33, 34, 35
    // Also check for any products that have "SWDNN" in name but low numeric ID compared to others?
    // Or just target the reported ones.
    const idsToDelete = [33, 34, 35];

    try {
        const result = await db.delete(products)
            .where(inArray(products.id, idsToDelete))
            .returning();

        console.log(`Deleted ${result.length} stale products:`, result.map(p => p.id));

        // Also verify if there are others by listing all
        const allProducts = await db.query.products.findMany({
            columns: { id: true, name: true, printifyProductId: true }
        });

        console.log(`Remaining products count: ${allProducts.length}`);
        // Log a few sample IDs to understand the "good" vs "bad" format
        console.log('Sample products:', allProducts.slice(0, 5));

        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupStaleProducts();
