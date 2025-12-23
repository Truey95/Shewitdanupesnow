import { motion } from "framer-motion";

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInStagger = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  },
};

export const itemFadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Collection-specific animations
export const swdnnAnimations = {
  container: {
    initial: { backgroundColor: "#000" },
    animate: { backgroundColor: "cream" },
    transition: { duration: 0.8 }
  },
  text: {
    initial: { opacity: 0, color: "#000" },
    animate: { opacity: 1, color: "#8B0000" },
    transition: { delay: 0.3, duration: 0.5 }
  }
};
