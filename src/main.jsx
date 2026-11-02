import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import "react-toastify/dist/ReactToastify.css";
import { AuthContextProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { CallProvider } from './context/CallContext.jsx';
import { MessagesProvider } from './context/MessagesContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthContextProvider>
          <CallProvider>
            <MessagesProvider>
              <ConfirmProvider>
                <App />
              </ConfirmProvider>
            </MessagesProvider>
          </CallProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
