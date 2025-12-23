import express from 'express';
import { shopifyHandlers } from '../services/shopify';

const router = express.Router();

router.get('/test', shopifyHandlers.checkConnection);
router.get('/products', shopifyHandlers.getProducts);
router.get('/products/:productId', shopifyHandlers.getProduct);
router.get('/collections', shopifyHandlers.getCollections);
router.get('/collections/:collectionId/products', shopifyHandlers.getProductsInCollection);

export default router;