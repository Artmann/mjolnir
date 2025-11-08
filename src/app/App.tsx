import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { Route, Routes } from 'react-router-dom'

import './index.css'
import { OverviewPage } from './pages/OverviewPage'
import { Layout } from './Layout'

const queryClient = new QueryClient()

export function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={<OverviewPage />}
            />
          </Routes>
        </Layout>
      </QueryClientProvider>
    </StrictMode>
  )
}
