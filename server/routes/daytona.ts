import express from 'express';
import { daytonaService } from '../services/daytona';

const router = express.Router();

// Test Daytona connection
router.get('/status', async (req, res) => {
  try {
    const isConfigured = daytonaService.isServiceConfigured();
    res.json({
      configured: isConfigured,
      service: 'Daytona API',
      status: isConfigured ? 'ready' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check Daytona status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get workspaces
router.get('/workspaces', async (req, res) => {
  try {
    const workspaces = await daytonaService.getWorkspaces();
    
    res.json({
      success: true,
      workspaces,
      message: 'Workspaces retrieved successfully'
    });
  } catch (error) {
    console.error('Daytona workspaces error:', error);
    res.status(500).json({
      error: 'Failed to get workspaces',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create workspace
router.post('/workspaces', async (req, res) => {
  try {
    const workspaceData = req.body;
    
    const result = await daytonaService.createWorkspace(workspaceData);
    
    res.json({
      success: true,
      workspace: result,
      message: 'Workspace created successfully'
    });
  } catch (error) {
    console.error('Daytona workspace creation error:', error);
    res.status(500).json({
      error: 'Failed to create workspace',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Sync product data with Daytona
router.post('/sync-product', async (req, res) => {
  try {
    const productData = req.body;
    
    if (!productData.productId) {
      return res.status(400).json({
        error: 'Missing product ID',
        details: 'productId is required'
      });
    }

    const result = await daytonaService.syncProductData(productData);
    
    res.json({
      success: true,
      result,
      message: 'Product synced successfully with Daytona'
    });
  } catch (error) {
    console.error('Daytona sync error:', error);
    res.status(500).json({
      error: 'Failed to sync product with Daytona',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Deploy project
router.post('/deploy/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const deploymentConfig = req.body;
    
    const result = await daytonaService.deployProject(projectId, deploymentConfig);
    
    res.json({
      success: true,
      deployment: result,
      message: 'Project deployed successfully'
    });
  } catch (error) {
    console.error('Daytona deployment error:', error);
    res.status(500).json({
      error: 'Failed to deploy project',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;