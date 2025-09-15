import React from 'react';

// Admin UI lazy imports
const AdminLayout = React.lazy(() => import('../components/admin/AdminLayout'));
const AdminDashboardPage = React.lazy(() => import('../pages/AdminDashboardPage'));
const ProductsAdminPage = React.lazy(() => import('../pages/admin/ProductsAdminPage'));
const OrdersAdminPage = React.lazy(() => import('../pages/admin/OrdersAdminPage'));
const UsersAdminPage = React.lazy(() => import('../pages/admin/UsersAdminPage'));
const SettingsAdminPage = React.lazy(() => import('../pages/admin/SettingsAdminPage'));
const CustomizeHomePage = React.lazy(() => import('../pages/admin/CustomizeHomePage'));
const RecycleBinPage = React.lazy(() => import('../pages/admin/RecycleBinPage'));
const AdminLoginPage = React.lazy(() => import('../pages/admin/AdminLoginPage'));
const RequireAdmin = React.lazy(() => import('./guards/RequireAdmin'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

const adminRoutes = [
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'products', element: <ProductsAdminPage /> },
      { path: 'orders', element: <OrdersAdminPage /> },
      { path: 'users', element: <UsersAdminPage /> },
      { path: 'recycle-bin', element: <RecycleBinPage /> },
      { path: 'settings', element: <SettingsAdminPage /> },
      { path: 'customize-home', element: <CustomizeHomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export default adminRoutes;
