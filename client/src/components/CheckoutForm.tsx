import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/lib/cart";
import { useMutation } from "@tanstack/react-query";

const checkoutSchema = z.object({
  customerEmail: z.string().email("Please enter a valid email address"),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerPhone: z.string().optional(),
  shippingAddress: z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    address1: z.string().min(1, "Address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state_code: z.string().min(2, "State is required"),
    country_code: z.string().min(2, "Country is required"),
    zip: z.string().min(1, "ZIP code is required"),
  }),
  billingAddress: z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    address1: z.string().min(1, "Address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state_code: z.string().min(2, "State is required"),
    country_code: z.string().min(2, "Country is required"),
    zip: z.string().min(1, "ZIP code is required"),
  }).optional(),
  sameAsShipping: z.boolean().default(true),
  cardNumber: z.string().min(16, "Card number is required"),
  expiryDate: z.string().min(5, "Expiry date is required"),
  cvv: z.string().min(3, "CVV is required"),
  cardholderName: z.string().min(1, "Cardholder name is required"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  onComplete: () => void;
}

export function CheckoutForm({ cartItems, subtotal, shipping, total, onComplete }: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerEmail: "",
      customerName: "",
      customerPhone: "",
      shippingAddress: {
        first_name: "",
        last_name: "",
        address1: "",
        address2: "",
        city: "",
        state_code: "",
        country_code: "US",
        zip: "",
      },
      sameAsShipping: true,
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    },
  });

  const sameAsShipping = form.watch("sameAsShipping");

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/printify/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return response.json();
    },
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentData }: { orderId: number; paymentData: any }) => {
      // Generate payment ID for tracking
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch(`/api/printify/orders/${orderId}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          shopId: '21023003', // Use the correct Printify shop ID for "She Wit Da Nupes Now"
          paymentMethod: paymentData.paymentMethod,
          cardData: {
            cardNumber: paymentData.cardNumber,
            expiryMonth: paymentData.expiryMonth,
            expiryYear: paymentData.expiryYear,
            cvv: paymentData.cvv,
            cardholderName: paymentData.cardholderName
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || 'Payment processing failed');
      }

      return response.json();
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);

    try {
      // Convert cart items to order format with proper validation
      const orderItems = cartItems.map(item => ({
        productId: typeof item.id === 'string' ? parseInt(item.id) : item.id,
        printifyProductId: `${item.id}`,
        printifyVariantId: item.variantId || `${item.id}_${item.size}`,
        name: item.name,
        size: item.size,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        quantity: item.quantity,
        imageUrl: item.image || '/placeholder-product.jpg',
      }));

      // Validate order items
      if (orderItems.length === 0) {
        throw new Error('No items in cart');
      }

      // Validate pricing
      const calculatedSubtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (Math.abs(calculatedSubtotal - subtotal) > 0.01) {
        throw new Error('Price mismatch detected. Please refresh and try again.');
      }

      // Create order
      const orderData = {
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress,
        billingAddress: sameAsShipping ? data.shippingAddress : data.billingAddress,
        items: orderItems,
        subtotal,
        shipping,
        tax: 0,
        total,
      };

      const orderResult = await createOrderMutation.mutateAsync(orderData);

      // Process payment
      const paymentData = {
        cardNumber: data.cardNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        cardholderName: data.cardholderName,
        amount: total,
      };

      await processPaymentMutation.mutateAsync({
        orderId: orderResult.order.id,
        paymentData,
      });

      // Clear cart and complete checkout
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cart-updated'));
      
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${orderResult.order.id} has been submitted to Printify for fulfillment.`,
      });

      onComplete();
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shippingAddress.first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingAddress.last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="shippingAddress.address1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shippingAddress.address2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment, suite, etc. (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shippingAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingAddress.state_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingAddress.zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="cardholderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cardholder Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input placeholder="1234 5678 9012 3456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/YY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CVV</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : `Place Order - $${total.toFixed(2)}`}
        </Button>
      </form>
    </Form>
  );
}