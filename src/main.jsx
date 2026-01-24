import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NavigationProvider, AuthProvider, PharmacyProvider, ThemeProvider, ContactsProvider, EmailProvider, PhotosProvider, ChatProvider } from './context'
import { ErrorBoundary } from './shared/ui'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PharmacyProvider>
            <ContactsProvider>
              <EmailProvider>
                <PhotosProvider>
                  <NavigationProvider>
                    <ChatProvider>
                      <App />
                    </ChatProvider>
                  </NavigationProvider>
                </PhotosProvider>
              </EmailProvider>
            </ContactsProvider>
          </PharmacyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
