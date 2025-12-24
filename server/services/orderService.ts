import { Request, Response } from 'express';
import { db } from '../../db/index.js';
import { orders, orderItems, products } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { printifyService } from './printify.js';

export interface CreateOrderRequest {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
  billingAddress?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
  items: Array<{
    productId: number;
    printifyProductId: string;
    printifyVariantId: string;
    name: string;
    size: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax?: number;
  total: number;
}

class OrderService {
  // Create order in our database and send to Printify for fulfillment
  async createOrder(orderData: CreateOrderRequest) {
    try {
      // Start a transaction to ensure data consistency
      const result = await db.transaction(async (tx: any) => {
        // Create order in our database
        const [order] = await tx.insert(orders).values({
          customerEmail: orderData.customerEmail,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          shippingAddress: orderData.shippingAddress,
          billingAddress: orderData.billingAddress || orderData.shippingAddress,
          subtotal: orderData.subtotal.toString(),
          shipping: orderData.shipping.toString(),
          tax: orderData.tax?.toString() || "0.00",
          total: orderData.total.toString(),
          status: 'pending',
          paymentStatus: 'pending'
        }).returning();

        // Create order items
        const orderItemsData = orderData.items.map(item => ({
          orderId: order.id,
          productId: item.productId,
          printifyProductId: item.printifyProductId,
          printifyVariantId: item.printifyVariantId,
          name: item.name,
          size: item.size,
          price: item.price.toString(),
          quantity: item.quantity,
          imageUrl: item.imageUrl
        }));

        await tx.insert(orderItems).values(orderItemsData);

        return { order, items: orderItemsData };
      });

      return result;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  // Process payment and create Printify order
  async processOrderPayment(orderId: number, paymentId: string, shopId: string) {
    try {
      console.log(`Processing payment for order ${orderId} with payment ID ${paymentId}`);

      // Get order details with items
      const orderWithItems = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          items: true
        }
      });

      if (!orderWithItems) {
        throw new Error('Order not found');
      }

      if (orderWithItems.items.length === 0) {
        throw new Error('Order has no items');
      }

      // Update payment status
      await db.update(orders)
        .set({
          paymentStatus: 'paid',
          paymentId,
          status: 'processing',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      console.log(`Payment status updated for order ${orderId}`);

      // Create Printify order for fulfillment
      const shippingAddr = orderWithItems.shippingAddress as any;

      // Validate shipping address
      if (!shippingAddr || !shippingAddr.first_name || !shippingAddr.address1 || !shippingAddr.city) {
        throw new Error('Invalid shipping address data');
      }

      const printifyOrderData = {
        external_id: `ORDER-${orderId}`,
        label: `Order #${orderId}`,
        line_items: orderWithItems.items.map((item: any) => ({
          product_id: item.printifyProductId,
          variant_id: item.printifyVariantId,
          quantity: item.quantity
        })),
        shipping_method: 1, // Standard shipping
        is_printify_express: false,
        send_shipping_notification: true,
        address_to: {
          first_name: shippingAddr.first_name,
          last_name: shippingAddr.last_name,
          email: orderWithItems.customerEmail,
          phone: orderWithItems.customerPhone || '',
          country: shippingAddr.country_code,
          region: shippingAddr.state_code,
          address1: shippingAddr.address1,
          address2: shippingAddr.address2 || '',
          city: shippingAddr.city,
          zip: shippingAddr.zip
        }
      };

      // Create order in Printify
      const printifyOrder = await printifyService.createOrder(shopId, printifyOrderData);

      // Update our order with Printify order ID
      await db.update(orders)
        .set({
          printifyOrderId: printifyOrder.data?.id || printifyOrder.id,
          printifyStatus: printifyOrder.data?.status || printifyOrder.status || 'created',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      // Submit to production if payment is successful
      const printifyOrderId = printifyOrder.data?.id || printifyOrder.id;
      if (printifyOrderId) {
        try {
          await printifyService.submitOrderForProduction(shopId, printifyOrderId);

          // Update status to indicate it's been sent to production
          await db.update(orders)
            .set({
              status: 'processing',
              printifyStatus: 'in_production',
              updatedAt: new Date()
            })
            .where(eq(orders.id, orderId));
        } catch (productionError) {
          console.warn('Order created but production submission failed:', productionError);
          // Don't fail the entire order process for this
        }
      }

      return {
        order: orderWithItems,
        printifyOrder,
        success: true,
        printifyOrderId
      };
    } catch (error) {
      // If Printify order creation fails, mark our order as failed
      await db.update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      console.error('Failed to process order payment:', error);
      throw error;
    }
  }

  // Calculate shipping costs using Printify
  async calculateShipping(shopId: string, orderData: any) {
    try {
      const shippingData = {
        line_items: orderData.items.map((item: any) => ({
          product_id: item.printifyProductId,
          variant_id: item.printifyVariantId,
          quantity: item.quantity
        })),
        address_to: orderData.shippingAddress
      };

      const shippingOptions = await printifyService.calculateShipping(shopId, shippingData);
      return shippingOptions;
    } catch (error) {
      console.error('Failed to calculate shipping:', error);
      throw error;
    }
  }

  // Sync product price from admin dashboard to Printify
  async syncProductPrice(productId: number, newPrice: number, shopId: string, printifyProductId: string) {
    try {
      // Update price in our database
      await db.update(products)
        .set({
          price: newPrice.toString(),
          printifySyncedAt: new Date(),
          printifySyncStatus: 'syncing'
        })
        .where(eq(products.id, productId));

      // Sync price to Printify
      await printifyService.syncProductPrice(shopId, printifyProductId, newPrice);

      // Update sync status
      await db.update(products)
        .set({
          printifySyncStatus: 'synced',
          printifySyncedAt: new Date()
        })
        .where(eq(products.id, productId));

      return { success: true, message: 'Price synced successfully' };
    } catch (error) {
      // Update sync status to failed
      await db.update(products)
        .set({
          printifySyncStatus: 'failed'
        })
        .where(eq(products.id, productId));

      console.error('Failed to sync product price:', error);
      throw error;
    }
  }

  // Get order status and tracking information
  async getOrderStatus(orderId: number) {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
          items: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // If we have a Printify order ID, get updated status
      if (order.printifyOrderId && order.printifyStatus !== 'fulfilled') {
        // This would require the shop ID - in a real implementation,
        // you'd store the shop ID with the order or have a default shop
        // For now, we'll return the stored status
      }

      return order;
    } catch (error) {
      console.error('Failed to get order status:', error);
      throw error;
    }
  }

  // Get all orders for admin dashboard
  async getAllOrders(limit: number = 50, offset: number = 0) {
    try {
      const allOrders = await db.query.orders.findMany({
        with: {
          items: true
        },
        limit,
        offset,
        orderBy: (orders: any, { desc }: any) => [desc(orders.createdAt)]
      });

      return allOrders;
    } catch (error) {
      console.error('Failed to get orders:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();

// Express route handlers
export const orderHandlers = {
  createOrder: async (req: Request, res: Response) => {
    try {
      const orderData: CreateOrderRequest = req.body;

      // Validate required fields
      if (!orderData.customerEmail || !orderData.customerName || !orderData.shippingAddress || !orderData.items || !Array.isArray(orderData.items)) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'customerEmail, customerName, shippingAddress, and items are required'
        });
      }

      // Validate numeric fields
      if (typeof orderData.subtotal !== 'number' || typeof orderData.shipping !== 'number' || typeof orderData.total !== 'number') {
        return res.status(400).json({
          error: 'Invalid numeric fields',
          message: 'subtotal, shipping, and total must be numbers'
        });
      }

      const result = await orderService.createOrder(orderData);
      res.json(result);
    } catch (error) {
      console.error('Failed to create order:', error);
      res.status(500).json({
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  processPayment: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { paymentId, shopId } = req.body;

      const result = await orderService.processOrderPayment(
        parseInt(orderId),
        paymentId,
        shopId
      );

      res.json(result);
    } catch (error) {
      console.error('Failed to process payment:', error);
      res.status(500).json({
        error: 'Failed to process payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  calculateShipping: async (req: Request, res: Response) => {
    try {
      const { shopId } = req.params;
      const orderData = req.body;

      const shippingOptions = await orderService.calculateShipping(shopId, orderData);
      res.json(shippingOptions);
    } catch (error) {
      console.error('Failed to calculate shipping:', error);
      res.status(500).json({
        error: 'Failed to calculate shipping',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  syncProductPrice: async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { price, shopId, printifyProductId } = req.body;

      const result = await orderService.syncProductPrice(
        parseInt(productId),
        parseFloat(price),
        shopId,
        printifyProductId
      );

      res.json(result);
    } catch (error) {
      console.error('Failed to sync product price:', error);
      res.status(500).json({
        error: 'Failed to sync product price',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getOrderStatus: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrderStatus(parseInt(orderId));
      res.json(order);
    } catch (error) {
      console.error('Failed to get order status:', error);
      res.status(500).json({
        error: 'Failed to get order status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getAllOrders: async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const orders = await orderService.getAllOrders(limit, offset);
      res.json(orders);
    } catch (error) {
      console.error('Failed to get orders:', error);
      res.status(500).json({
        error: 'Failed to get orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};