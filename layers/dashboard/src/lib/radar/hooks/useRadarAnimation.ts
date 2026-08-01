export const radarPointAnimation = {
    initial: { opacity: 0, scale: 0.6 },
    animate: { opacity: 1, scale: 1 },
    // Calm and responsive: easeOut
    transition: { duration: 0.4, ease: "easeOut" },
};

// We can define stagger wrappers later if needed, but Framer Motion's
// standard stagger works by setting transition: { delay: index * 0.04 }
