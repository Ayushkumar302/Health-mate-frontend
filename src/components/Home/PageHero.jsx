import { motion } from "framer-motion";
import Aurora from "./Aurora";

// title block at the top of inner pages (Services, Doctors, Contact)
function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <section className="relative isolate overflow-hidden pb-10 pt-14 lg:pb-14 lg:pt-20">
      <Aurora />
      <div className="container text-center">
        {eyebrow && (
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default PageHero;
