import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { pageTransition, fadeInStagger, itemFadeIn, swdnnAnimations } from "@/components/animations/page-transitions";
import { useProductsByCategory } from "@/hooks/use-products-by-category";
import ProductCard from "@/components/ProductCard";
import { Loader2 } from "lucide-react";

export default function SWDNNCollection() {
  const { data: productsData, isLoading, error } = useProductsByCategory('swdnn');

  return (
    <motion.div
      className="min-h-screen w-full"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={swdnnAnimations.container}
      style={{ backgroundColor: '#8B0000' }}
    >
      <div className="container mx-auto py-16">
        <motion.h1 
          className="text-6xl font-serif mb-4 text-white"
          variants={swdnnAnimations.text}
        >
          She Wit Da Nupes Now
        </motion.h1>
        
        <motion.p 
          className="text-xl text-white/80 mb-12"
          variants={swdnnAnimations.text}
        >
          Main Collection - Luxury Apparel for the Modern Woman
        </motion.p>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-white mr-3" />
            <span className="text-white text-lg">Loading products...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-white text-lg">Unable to load products at this time.</p>
          </div>
        ) : productsData?.data && productsData.data.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={fadeInStagger}
          >
            {productsData.data.filter(product => product.isActive).map((product) => (
              <motion.div key={product.id} variants={itemFadeIn}>
                <ProductCard 
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={fadeInStagger}
          >
            <motion.div 
              className="aspect-square bg-white/10 rounded-lg p-6 flex items-center justify-center"
              variants={itemFadeIn}
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                transition: { duration: 0.3 }
              }}
            >
              <p className="text-2xl text-white">Coming Soon</p>
            </motion.div>
          </motion.div>
        )}

        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="mt-8"
              style={{ 
                backgroundColor: '#8B0000',
                color: 'cream'
              }}
            >
              Back to Home
            </Button>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}