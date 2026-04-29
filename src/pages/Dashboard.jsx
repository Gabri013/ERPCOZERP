import { useEffect, useState } from 'react';
import { DollarSign, Factory, Package, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const cards = [
  {
    title: 'Total de Vendas',
    valueKey: 'totalVendas',
    fallback: 'R$ 0',
    icon: DollarSign,
  },
  {
    title: 'Ordens de Producao',
    valueKey: 'totalOPs',
    fallback: '0',
    icon: Factory,
  },
  {
    title: 'Produtos em Estoque',
    valueKey: 'totalProdutos',
    fallback: '0',
    icon: Package,
  },
  {
    title: 'Clientes Ativos',
    valueKey: 'totalClientes',
    fallback: '0',
    icon: Users,
  },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      try {
        const response = await fetch('/api/dashboard/kpis');
        const json = await response.json();

        if (mounted && json?.success) {
          setKpis(json.data || {});
        }
      } catch {
        if (mounted) {
          setKpis({});
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ title, valueKey, fallback, icon: Icon }) => (
          <Card key={valueKey}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis[valueKey] ?? fallback}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
