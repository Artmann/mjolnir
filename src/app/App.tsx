import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { Route, Routes } from 'react-router-dom'

import './index.css'
import { Layout } from './Layout'
import { AppPage } from './pages/AppPage'
import { OverviewPage } from './pages/OverviewPage'

const queryClient = new QueryClient()

export function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Routes>
            <Route
              element={<OverviewPage />}
              path="/"
            />
            <Route
              element={<AppPage />}
              path="/apps/:id"
            />
          </Routes>
        </Layout>
      </QueryClientProvider>
    </StrictMode>
  )
}
