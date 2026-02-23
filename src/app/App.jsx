import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppProviders from '@/app/providers/AppProviders'
import Router from '@/app/Router'

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </AppProviders>
  )
}
