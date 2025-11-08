import { Route, Routes } from 'react-router-dom'

import './index.css'

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<div>Foo</div>}
      />
    </Routes>
  )
}
