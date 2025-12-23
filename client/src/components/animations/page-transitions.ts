import { Variants } from "framer-motion";

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeInOut" }
};

export const fadeInStagger: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemFadeIn: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export const swdnnAnimations = {
  container: {
    initial: { 
      opacity: 0,
      background: "linear-gradient(135deg, #8B0000 0%, #A52A2A 100%)"
    },
    animate: { 
      opacity: 1,
      background: "linear-gradient(135deg, #8B0000 0%, #A52A2A 100%)",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  },
  text: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }
    }
  }
};

export const hwdknAnimations = {
  container: {
    initial: { 
      opacity: 0,
      background: "linear-gradient(135deg, #DC143C 0%, #FF1493 100%)"
    },
    animate: { 
      opacity: 1,
      background: "linear-gradient(135deg, #DC143C 0%, #FF1493 100%)",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  },
  text: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }
    }
  }
};

export const hwdrnAnimations = {
  container: {
    initial: { 
      opacity: 0,
      background: "linear-gradient(135deg, #B22222 0%, #DC143C 100%)"
    },
    animate: { 
      opacity: 1,
      background: "linear-gradient(135deg, #B22222 0%, #DC143C 100%)",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  },
  text: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }
    }
  }
};

export const hwdznAnimations = {
  container: {
    initial: { 
      opacity: 0,
      background: "linear-gradient(135deg, #1E90FF 0%, #4169E1 100%)"
    },
    animate: { 
      opacity: 1,
      background: "linear-gradient(135deg, #1E90FF 0%, #4169E1 100%)",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  },
  text: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }
    }
  }
};

export const hwdpnAnimations = {
  container: {
    initial: { 
      opacity: 0,
      background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
    },
    animate: { 
      opacity: 1,
      background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  },
  text: {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }
    }
  }
};