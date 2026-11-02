import { MotionConfig } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import Layout from './layout/Layout';
import { useTheme } from './context/ThemeContext';

function App() {
  const { theme } = useTheme();

  return (
    // reducedMotion="user" turns animations off for people who ask their OS for less motion
    <MotionConfig reducedMotion="user">
      <ToastContainer
        theme={theme === 'dark' ? 'dark' : 'light'}
        position='top-right'
        autoClose={2500}
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        toastClassName='!rounded-xl !font-sans'
      />
      <Layout />
    </MotionConfig>
  )
}

export default App
