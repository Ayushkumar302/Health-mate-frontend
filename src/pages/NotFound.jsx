import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Aurora from "@/components/Home/Aurora";

function NotFound() {
  return (
    <section className="relative isolate grid min-h-[70vh] place-items-center overflow-hidden">
      <Aurora />
      <div className="container text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="gradient-text text-[120px] font-extrabold leading-none sm:text-[160px]"
        >
          404
        </motion.p>
        <h1 className="mt-4 text-2xl font-bold">This page took a sick day</h1>
        <p className="mt-2 text-muted-foreground">The page you are looking for doesn&apos;t exist or was moved.</p>
        <Link to="/">
          <Button className="mt-8">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
