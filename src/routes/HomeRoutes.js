import React from 'react';

// Lazy-loaded public pages
const HomePage = React.lazy(() => import('../pages/HomePage'));
const ProductsPage = React.lazy(() => import('../pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('../pages/ProductDetailPage'));
const ContactPage = React.lazy(() => import('../pages/ContactPage'));
const MembershipPage = React.lazy(() => import('../pages/MembershipPage'));
const PoliciesPage = React.lazy(() => import('../pages/policies/PoliciesPage'));
const PrivacyPolicyPage = React.lazy(() => import('../pages/policies/PrivacyPolicyPage'));
const ExchangePolicyPage = React.lazy(() => import('../pages/policies/ExchangePolicyPage'));
const ShippingPolicyPage = React.lazy(() => import('../pages/policies/ShippingPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('../pages/policies/TermsOfServicePage'));
const TrackOrderPage = React.lazy(() => import('../pages/TrackOrderPage'));
const AccessDeniedPage = React.lazy(() => import('../pages/AccessDeniedPage'));

const homeRoutes = [
  { path: '/', element: <HomePage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/product/:id', element: <ProductDetailPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/policies', element: <PoliciesPage /> },
  { path: '/policies/privacy', element: <PrivacyPolicyPage /> },
  { path: '/policies/exchange', element: <ExchangePolicyPage /> },
  { path: '/policies/shipping', element: <ShippingPolicyPage /> },
  { path: '/policies/terms', element: <TermsOfServicePage /> },
  { path: '/track-order', element: <TrackOrderPage /> },
  { path: '/access-denied', element: <AccessDeniedPage /> },
  { path: '/membership', element: <MembershipPage /> },
];

export default homeRoutes;
