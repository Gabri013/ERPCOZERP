import { lazy } from 'react';

const OrdensProducao = lazy(() => import('@/pages/producao/OrdensProducao'));
const DetalheOP = lazy(() => import('@/pages/producao/DetalheOP'));
const ListaMateriais = lazy(() => import('@/pages/producao/ListaMateriais'));
const RequisicaoMateriais = lazy(() => import('@/pages/producao/RequisicaoMateriais'));
const ReporteProducao = lazy(() => import('@/pages/producao/ReporteProducao'));
const CusteioPadrao = lazy(() => import('@/pages/producao/CusteioPadrao'));
const CusteioReal = lazy(() => import('@/pages/producao/CusteioReal'));

export const productionRoutes = [
  { path: '/producao/ordens', element: <OrdensProducao />, permission: 'ver_op' },
  { path: '/producao/ordens/:id', element: <DetalheOP />, permission: 'ver_op' },
  { path: '/producao/materiais', element: <ListaMateriais />, permission: 'ver_op' },
  { path: '/producao/requisicoes', element: <RequisicaoMateriais />, permission: 'ver_op' },
  { path: '/producao/reporte', element: <ReporteProducao />, permission: 'ver_op' },
  { path: '/producao/custeio-padrao', element: <CusteioPadrao />, permission: 'ver_pcp' },
  { path: '/producao/custeio-real', element: <CusteioReal />, permission: 'ver_pcp' },
];