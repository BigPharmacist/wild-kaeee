import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import './index.css'
import { queryClient } from './lib/queryClient'
import { router } from './app/router'
import { NavigationProvider, AuthProvider, PharmacyProvider, StaffProvider, ThemeProvider, ContactsProvider, EmailProvider, PhotosProvider, ChatProvider } from './context'
import { ErrorBoundary, ConnectionStatus } from './shared/ui'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <PharmacyProvider>
              <StaffProvider>
                <ContactsProvider>
                  <EmailProvider>
                    <PhotosProvider>
                      <NavigationProvider>
                        <ChatProvider>
                          <RouterProvider router={router} />
                          <ConnectionStatus />
                        </ChatProvider>
                      </NavigationProvider>
                    </PhotosProvider>
                  </EmailProvider>
                </ContactsProvider>
              </StaffProvider>
            </PharmacyProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
