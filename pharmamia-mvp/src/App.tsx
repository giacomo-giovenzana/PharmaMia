import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@features/auth/ProtectedRoute'
import { AuthCallbackPage } from '@features/auth/AuthCallbackPage'
import { LoginPage } from '@features/auth/LoginPage'
import { RegisterPage } from '@features/auth/RegisterPage'
import { VerifyEmailPage } from '@features/auth/VerifyEmailPage'
import { HomePage } from '@features/home/HomePage'
import { ScanPage } from '@features/scanning/ScanPage'
import { MedicineFormPage } from '@features/inventory/MedicineFormPage'
import { MedicineDetailPage } from '@features/inventory/MedicineDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <ScanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicine/new"
        element={
          <ProtectedRoute>
            <MedicineFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicine/:id"
        element={
          <ProtectedRoute>
            <MedicineDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicine/:id/edit"
        element={
          <ProtectedRoute>
            <MedicineFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
