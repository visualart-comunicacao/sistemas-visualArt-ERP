import React from 'react'
import { Routes, Route } from 'react-router-dom'

import ProtectedRoute from '@/app/guards/ProtectedRoute'
import AdminRoute from '@/app/guards/AdminRoute'

import AppLayout from '@/app/layouts/AppLayout'
import AuthLayout from '@/app/layouts/AuthLayout'
import LoginPage from '@/modules/auth/pages/LoginPage'
import VisualChatPage from '@/modules/visual-chat/pages/VisualChatPage'
import CustomersListPage from '@/modules/customers/pages/CustomersListPage'
import QuotesListPage from '@/modules/quotes/pages/QuotesListPage'
import ProductEditPage from '../modules/catalog/pages/ProductEditPage'
import ProductsListPage from '../modules/catalog/pages/ProductslistPage'
import UsersPage from '../modules/admin/pages/users/UsersPage'
import ProfilePage from '../modules/admin/pages/profile/Profilepage'
import QuotesCreatePage from '../modules/quotes/pages/QuotesCreatePage'
import QuotesDetailPage from '../modules/quotes/detail/QuotesDetailPage'
// Pages (vamos criar agora “placeholder” simples)
function DashboardPage() {
  return <div>Dashboard</div>
}

function AdminDashboardPage() {
  return <div>Admin</div>
}

export default function Router() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersListPage />} />

        <Route path="/catalog/products" element={<ProductsListPage />} />
        <Route path="/catalog/products/new" element={<ProductEditPage mode="create" />} />
        <Route path="/catalog/products/:id/edit" element={<ProductEditPage mode="edit" />} />

        <Route path="/quotes" element={<QuotesListPage />} />
        <Route path="/quotes/:id" element={<QuotesDetailPage />} />
        <Route path="/quotes/new" element={<QuotesCreatePage />} />

        <Route path="/visual-chat" element={<VisualChatPage />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <AdminRoute>
              <ProfilePage />
            </AdminRoute>
          }
        />
      </Route>
    </Routes>
  )
}
