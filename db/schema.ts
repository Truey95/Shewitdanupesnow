import { pgTable, text, serial, integer, timestamp, decimal, boolean, jsonb, varchar, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  printfulProductId: bigint("printful_product_id", { mode: "number" }),
  printfulSyncedAt: timestamp("printful_synced_at"),
  printfulSyncStatus: text("printful_sync_status"),
  printfulData: jsonb("printful_data"),
  // Printify integration fields
  printifyProductId: text("printify_product_id"),
  printifyShopId: text("printify_shop_id"),
  printifySyncedAt: timestamp("printify_synced_at"),
  printifySyncStatus: text("printify_sync_status"),
  printifyData: jsonb("printify_data"),
  isActive: boolean("is_active").default(true)
});

export const productSizes = pgTable("product_sizes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  size: text("size").notNull(),
  inStock: integer("in_stock").notNull(),
  printfulVariantId: integer("printful_variant_id"),
  printfulSku: text("printful_sku")
});

export const printfulSyncLogs = pgTable("printful_sync_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  status: text("status").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  syncData: jsonb("sync_data")
});

// Orders table for processing customer orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: jsonb("shipping_address").notNull(),
  billingAddress: jsonb("billing_address"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, fulfilled, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  paymentId: text("payment_id"),
  printifyOrderId: text("printify_order_id"),
  printifyStatus: text("printify_status"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  printifyProductId: text("printify_product_id"),
  printifyVariantId: text("printify_variant_id"),
  name: text("name").notNull(),
  size: text("size").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  imageUrl: text("image_url")
});

// Printify webhooks log
export const printifyWebhooks = pgTable("printify_webhooks", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  orderId: text("order_id"),
  productId: text("product_id"),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const productsRelations = relations(products, ({ many }) => ({
  sizes: many(productSizes),
  syncLogs: many(printfulSyncLogs),
  orderItems: many(orderItems)
}));

export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, {
    fields: [productSizes.productId],
    references: [products.id]
  })
}));

export const printfulSyncLogsRelations = relations(printfulSyncLogs, ({ one }) => ({
  product: one(products, {
    fields: [printfulSyncLogs.productId],
    references: [products.id]
  })
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));

// Schema types
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertProductSizeSchema = createInsertSchema(productSizes);
export const selectProductSizeSchema = createSelectSchema(productSizes);

export const insertPrintfulSyncLogSchema = createInsertSchema(printfulSyncLogs);
export const selectPrintfulSyncLogSchema = createSelectSchema(printfulSyncLogs);

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

// Events table for tours and events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  images: jsonb("images").notNull().default('[]'), // Array of image URLs
  videos: jsonb("videos").notNull().default('[]'), // Array of video URLs
  links: jsonb("links").notNull().default('[]'), // Array of {title: string, url: string}
  isActive: boolean("is_active").default(true),
  featured: boolean("featured").default(false),
  capacity: integer("capacity"),
  price: decimal("price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Event registrations table (if needed for future)
export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  numberOfGuests: integer("number_of_guests").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow()
});

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
}));

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations);
export const selectEventRegistrationSchema = createSelectSchema(eventRegistrations);

export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);

export const insertPrintifyWebhookSchema = createInsertSchema(printifyWebhooks);
export const selectPrintifyWebhookSchema = createSelectSchema(printifyWebhooks);

export type Product = typeof products.$inferSelect;
export type ProductSize = typeof productSizes.$inferSelect;
export type PrintfulSyncLog = typeof printfulSyncLogs.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PrintifyWebhook = typeof printifyWebhooks.$inferSelect;