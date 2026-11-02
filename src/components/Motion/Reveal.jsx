import { motion } from "framer-motion";

// fades + slides content in the first time it scrolls into view
export const Reveal = ({ children, delay = 0, y = 24, className = "", as = "div" }) => {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
};

// parent + child variants for staggered grids
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const Stagger = ({ children, className = "" }) => (
  <motion.div
    className={className}
    variants={staggerParent}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-60px" }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = "" }) => (
  <motion.div className={className} variants={staggerChild}>
    {children}
  </motion.div>
);

// centered eyebrow + title + subtitle used at the top of most sections
export const SectionHeading = ({ eyebrow, title, subtitle, align = "center" }) => (
  <Reveal className={`${align === "center" ? "mx-auto text-center" : ""} max-w-2xl`}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
    <h2 className="heading mt-4">{title}</h2>
    {subtitle && <p className="text__para">{subtitle}</p>}
  </Reveal>
);
