// Simplified animations to pass build
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInStagger = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const itemFadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const swdnnAnimations = {
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8 }
  },
  text: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: 0.3, duration: 0.5 }
  }
};
