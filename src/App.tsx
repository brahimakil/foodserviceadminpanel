import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/layout/AdminLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

// Pages
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Brands from "@/pages/Brands";
import Banners from "@/pages/Banners";
import ContactMessages from "@/pages/ContactMessages";
import AdminManagement from "@/pages/AdminManagement";
import PDFCatalogs from "@/pages/PDFCatalogs";
import Settings from "@/pages/Settings";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route
        path="/*"
        element={
          user ? (
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/banners" element={<Banners />} />
                <Route path="/messages" element={<ContactMessages />} />
                <Route path="/catalogs" element={<PDFCatalogs />} />
                <Route path="/admins" element={<AdminManagement />} />
                <Route path="/settings" element={<Settings />} />
                {/* Catch all unmatched routes and redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <AppRoutes />
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
