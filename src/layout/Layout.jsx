import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Header from "../components/Header/Header"
import DemoBanner from "../components/Header/DemoBanner"
import Footer from "../components/Footer/Footer"
import Routers from '@/routes/Routers'
import MiniCall from '@/components/Video/MiniCall'

function Layout() {
  const location = useLocation()

  // start each new page at the top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
        <div className="print:hidden">
          <DemoBanner/>
        </div>
        <div className="sticky top-0 z-50 print:hidden">
          <Header/>
        </div>
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className="flex-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Routers location={location}/>
          </motion.main>
        </AnimatePresence>
        <div className="print:hidden">
          <Footer/>
          {/* an active video call follows the user around the site as a floating window */}
          <MiniCall/>
        </div>
    </div>
  )
}

export default Layout
