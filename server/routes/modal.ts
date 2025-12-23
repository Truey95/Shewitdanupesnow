import express from 'express';
import { modalService } from '../services/modal';

const router = express.Router();

// Test Modal connection
router.get('/status', async (req, res) => {
  try {
    const isConfigured = modalService.isServiceConfigured();
    res.json({
      configured: isConfigured,
      service: 'Modal API',
      status: isConfigured ? 'ready' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check Modal status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process product data with Modal
router.post('/process-product', async (req, res) => {
  try {
    const productData = req.body;
    
    if (!productData.productId) {
      return res.status(400).json({
        error: 'Missing product ID',
        details: 'productId is required'
      });
    }

    const result = await modalService.processProductData(productData);
    
    res.json({
      success: true,
      result,
      message: 'Product processed successfully with Modal'
    });
  } catch (error) {
    console.error('Modal processing error:', error);
    res.status(500).json({
      error: 'Failed to process product with Modal',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate product with Modal
router.post('/validate-product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const isValid = await modalService.validateProduct(productId);
    
    res.json({
      success: true,
      productId,
      valid: isValid,
      message: isValid ? 'Product is valid' : 'Product validation failed'
    });
  } catch (error) {
    console.error('Modal validation error:', error);
    res.status(500).json({
      error: 'Failed to validate product with Modal',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Execute custom Modal function
router.post('/execute/:functionName', async (req, res) => {
  try {
    const { functionName } = req.params;
    const payload = req.body;
    
    const result = await modalService.executeFunction(functionName, payload);
    
    res.json({
      success: true,
      function: functionName,
      result,
      message: 'Modal function executed successfully'
    });
  } catch (error) {
    console.error('Modal function execution error:', error);
    res.status(500).json({
      error: `Failed to execute Modal function: ${req.params.functionName}`,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;