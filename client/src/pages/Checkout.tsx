
import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, CreditCard, MapPin, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

// Schemas for validation
const shippingSchema = z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    address1: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    zip: z.string().min(5, "ZIP code is required"),
    country: z.string().min(2, "Country is required"),
});

const paymentSchema = z.object({
    cardNumber: z.string().min(16, "Card number must be 16 digits"),
    expiryDate: z.string().min(5, "Expiry date (MM/YY) is required"),
    cvv: z.string().min(3, "CVV is required"),
    cardHolder: z.string().min(2, "Cardholder name is required"),
});

export default function Checkout() {
    const [step, setStep] = useState(1);
    const [, setLocation] = useLocation();
    const cart = useCart();
    const { toast } = useToast();

    // Form states
    const [shippingData, setShippingData] = useState<z.infer<typeof shippingSchema>>({
        email: "", firstName: "", lastName: "", address1: "", city: "", state: "", zip: "", country: "US"
    });
    const [paymentData, setPaymentData] = useState<z.infer<typeof paymentSchema>>({
        cardNumber: "", expiryDate: "", cvv: "", cardHolder: ""
    });

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + shippingCost;

    // Mutations
    const createOrderMutation = useMutation({
        mutationFn: async (orderData: any) => {
            const response = await fetch('/api/printify/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            if (!response.ok) throw new Error('Failed to create order');
            return response.json();
        },
    });

    const processPaymentMutation = useMutation({
        mutationFn: async ({ orderId }: { orderId: string }) => {
            const paymentId = `pay_${Date.now()}`;
            const response = await fetch(`/api/printify/orders/${orderId}/process-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentId,
                    shopId: '21023003',
                    paymentMethod: 'credit_card',
                    cardData: { ...paymentData }
                }),
            });
            if (!response.ok) throw new Error('Payment failed');
            return response.json();
        },
    });

    const handlePlaceOrder = async () => {
        try {
            const orderItems = cart.map(item => ({
                productId: item.id,
                printifyProductId: item.id,
                printifyVariantId: item.variantId || `${item.id}_${item.size}`,
                name: item.name,
                size: item.size,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.image
            }));

            const orderData = {
                customerEmail: shippingData.email,
                customerName: `${shippingData.firstName} ${shippingData.lastName}`,
                shippingAddress: {
                    first_name: shippingData.firstName,
                    last_name: shippingData.lastName,
                    address1: shippingData.address1,
                    city: shippingData.city,
                    state_code: shippingData.state,
                    country_code: shippingData.country,
                    zip: shippingData.zip
                },
                items: orderItems,
                subtotal,
                shipping: shippingCost,
                total
            };

            const orderResult = await createOrderMutation.mutateAsync(orderData);
            await processPaymentMutation.mutateAsync({ orderId: orderResult.order.id });

            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cart-updated'));
            toast({
                title: "Order Placed!",
                description: `Your order #${orderResult.order.id} has been confirmed.`,
            });
            setLocation("/");
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Order Failed",
                description: "There was a problem placing your order. Please try again."
            });
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Your cart is empty</h2>
                <Button onClick={() => setLocation("/products")} className="rounded-full px-8 py-6 shadow-xl shadow-primary/20">Shop Now</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Left Column: Flow */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Stepper Header */}
                    <nav aria-label="Progress">
                        <ol role="list" className="flex items-center">
                            <li className={`relative pr-8 sm:pr-20 ${step > 1 ? "text-primary" : "text-primary"}`}>
                                <div className="flex items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= 1 ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-gray-200 bg-white"}`}>
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <span className="ml-3 text-sm font-bold tracking-wide uppercase">Shipping</span>
                                </div>
                                <div className={`absolute top-5 w-full h-0.5 left-0 -ml-px transition-colors duration-500 ease-in-out ${step > 1 ? "bg-primary" : "bg-gray-100"}`} style={{ left: '2.5rem', width: 'calc(100% - 2.5rem)' }} />
                            </li>
                            <li className={`relative px-8 sm:px-20 ${step > 2 ? "text-primary" : "text-gray-400"}`}>
                                <div className="flex items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= 2 ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-gray-200 bg-white"}`}>
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <span className="ml-3 text-sm font-bold tracking-wide uppercase">Payment</span>
                                </div>
                                <div className={`absolute top-5 w-full h-0.5 left-0 -ml-px transition-colors duration-500 ease-in-out ${step > 2 ? "bg-primary" : "bg-gray-100"}`} style={{ left: '2.5rem', width: 'calc(100% - 5rem)' }} />
                            </li>
                            <li className={`relative pl-8 sm:pl-20 ${step === 3 ? "text-primary" : "text-gray-400"}`}>
                                <div className="flex items-center">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= 3 ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-gray-200 bg-white"}`}>
                                        <Check className="h-5 w-5" />
                                    </div>
                                    <span className="ml-3 text-sm font-bold tracking-wide uppercase">Review</span>
                                </div>
                            </li>
                        </ol>
                    </nav>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-neutral-200/50 space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Contact & Shipping</h2>
                                        <p className="text-gray-500 mt-1">Where should we send your order?</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">Email Address</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.email} onChange={e => setShippingData({ ...shippingData, email: e.target.value })} placeholder="you@example.com" />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">First Name</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.firstName} onChange={e => setShippingData({ ...shippingData, firstName: e.target.value })} placeholder="Jane" />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">Last Name</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.lastName} onChange={e => setShippingData({ ...shippingData, lastName: e.target.value })} placeholder="Doe" />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">Street Address</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.address1} onChange={e => setShippingData({ ...shippingData, address1: e.target.value })} placeholder="1234 Main St" />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">City</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.city} onChange={e => setShippingData({ ...shippingData, city: e.target.value })} />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">State</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.state} onChange={e => setShippingData({ ...shippingData, state: e.target.value })} placeholder="CA" />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">ZIP Code</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.zip} onChange={e => setShippingData({ ...shippingData, zip: e.target.value })} />
                                        </div>
                                        <div className="col-span-1">
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">Country</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={shippingData.country} onChange={e => setShippingData({ ...shippingData, country: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-6">
                                        <Button
                                            className="rounded-full px-8 py-6 text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                                            onClick={() => {
                                                try {
                                                    shippingSchema.parse(shippingData);
                                                    setStep(2);
                                                } catch (e: any) {
                                                    toast({ title: "Please check details", description: e.errors?.[0]?.message || "Invalid input", variant: "destructive" });
                                                }
                                            }}>
                                            Continue to Payment <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-neutral-200/50 space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                                        <p className="text-gray-500 mt-1">Secure encrypted payment</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">Card Number</Label>
                                            <div className="relative">
                                                <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 pl-12 shadow-sm font-mono" value={paymentData.cardNumber} onChange={e => setPaymentData({ ...paymentData, cardNumber: e.target.value })} placeholder="0000 0000 0000 0000" />
                                                <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">Expiry Date</Label>
                                                <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm text-center" value={paymentData.expiryDate} onChange={e => setPaymentData({ ...paymentData, expiryDate: e.target.value })} placeholder="MM/YY" />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">CVV / CVC</Label>
                                                <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm text-center" type="password" value={paymentData.cvv} onChange={e => setPaymentData({ ...paymentData, cvv: e.target.value })} placeholder="123" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block ml-1">Cardholder Name</Label>
                                            <Input className="rounded-2xl border-gray-200 bg-gray-50/50 focus:bg-white transition-all duration-200 h-12 px-4 shadow-sm" value={paymentData.cardHolder} onChange={e => setPaymentData({ ...paymentData, cardHolder: e.target.value })} placeholder="Name on card" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between pt-6">
                                        <Button variant="ghost" className="rounded-full px-6 hover:bg-gray-100" onClick={() => setStep(1)}>
                                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                        </Button>
                                        <Button
                                            className="rounded-full px-8 py-6 text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5"
                                            onClick={() => {
                                                try {
                                                    paymentSchema.parse(paymentData);
                                                    setStep(3);
                                                } catch (e: any) {
                                                    toast({ title: "Invalid Payment", description: e.errors?.[0]?.message, variant: "destructive" });
                                                }
                                            }}>
                                            Review Order <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-neutral-200/50 space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
                                        <p className="text-gray-500 mt-1">Double check your details</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                                            <h3 className="font-bold text-gray-900 mb-3 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Shipping</h3>
                                            <p className="text-gray-600">{shippingData.firstName} {shippingData.lastName}</p>
                                            <p className="text-gray-600">{shippingData.address1}</p>
                                            <p className="text-gray-600">{shippingData.city}, {shippingData.state} {shippingData.zip}</p>
                                            <p className="text-gray-600">{shippingData.country}</p>
                                        </div>
                                        <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                                            <h3 className="font-bold text-gray-900 mb-3 flex items-center"><CreditCard className="h-4 w-4 mr-2" /> Payment</h3>
                                            <p className="text-gray-600 font-mono">**** **** **** {paymentData.cardNumber.slice(-4)}</p>
                                            <p className="text-gray-600">Exp: {paymentData.expiryDate}</p>
                                            <p className="text-gray-600">{paymentData.cardHolder}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-8">
                                        <Button variant="ghost" className="rounded-full px-6 hover:bg-gray-100" onClick={() => setStep(2)}>
                                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                                        </Button>
                                        <Button
                                            onClick={handlePlaceOrder}
                                            disabled={createOrderMutation.isPending || processPaymentMutation.isPending}
                                            className="rounded-full px-10 py-6 text-lg font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-primary to-primary/90"
                                        >
                                            {createOrderMutation.isPending ? "Processing..." : "Confirm & Pay"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Column: Order Summary (Sticky) */}
                <div className="lg:col-span-5">
                    <div className="sticky top-8 space-y-6">
                        <Card className="border-0 shadow-2xl shadow-neutral-200/50 bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-6">
                                <CardTitle className="text-xl font-bold flex items-center gap-3">
                                    <ShoppingBag className="h-6 w-6 text-primary" /> Your Order
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-8 px-8 pb-8">
                                <div className="max-h-[300px] overflow-y-auto space-y-6 pr-2 -mr-4 custom-scrollbar">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex gap-5 group">
                                            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white shadow-md border border-neutral-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="font-bold text-gray-900 line-clamp-2 leading-tight">{item.name}</p>
                                                <div className="flex justify-between items-center text-sm text-gray-500">
                                                    <span className="bg-neutral-100 px-2 py-0.5 rounded-md font-medium">{item.size}</span>
                                                    <span>x {item.quantity}</span>
                                                </div>
                                            </div>
                                            <div className="font-bold text-gray-900">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="bg-neutral-100" />
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span className="font-medium text-gray-900">{shippingCost === 0 ? "Free" : `$${shippingCost}`}</span>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-neutral-100 flex justify-between text-2xl font-black text-gray-900">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
