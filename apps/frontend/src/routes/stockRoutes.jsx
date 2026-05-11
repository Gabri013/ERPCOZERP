import { lazy } from 'react';

const ProductsPage = lazy(() => import('@/pages/products/ProductsPage'));
const ProductForm = lazy(() => import('@/pages/products/ProductForm'));
const StockMovementsPage = lazy(() => import('@/pages/products/StockMovementsPage'));
const InventoryPage = lazy(() => import('@/pages/products/InventoryPage'));
const InventoryCountDetail = lazy(() => import('@/pages/products/InventoryCountDetail'));
const LocationsPage = lazy(() => import('@/pages/products/LocationsPage'));

export const stockRoutes = [
  { path: '/estoque/produtos', element: <ProductsPage />, permission: 'ver_estoque' },
  { path: '/estoque/produtos/novo', element: <ProductForm />, permission: 'produto.create' },
  { path: '/estoque/produtos/:id', element: <ProductForm />, permission: 'ver_estoque' },
  { path: '/estoque/movimentacoes', element: <StockMovementsPage />, permission: 'ver_estoque' },
  { path: '/estoque/inventario', element: <InventoryPage />, permission: 'ver_estoque' },
  { path: '/estoque/inventario/:id', element: <InventoryCountDetail />, permission: 'ver_estoque' },
  { path: '/estoque/locais', element: <LocationsPage />, permission: 'ver_estoque' },
];