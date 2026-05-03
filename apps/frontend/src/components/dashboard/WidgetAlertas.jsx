import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { usePermissions } from '@/lib/PermissaoContext';
import {
  fetchEstoqueCriticoApi,
  fetchPedidosDraftParaAprovacaoPrisma,
  fetchSaldoFinanceiroApi,
} from '@/services/businessLogicApi';

const fmtR = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

/**
 * @param {object} props
 * @param {'financeiro'|'pedidos'|'aprovacao'|'ferias'} [props.tipo]
 * @param {'mine'|'company'} [props.dashboardScope]
 */
export default function WidgetAlertas({ tipo }) {
  const { pode } = usePermissions();
  const [critico, setCritico] = useState([]);
  const [saldo, setSaldo] = useState({ totalVencidoPagar: 0 });
  const [aguardando, setAguardando] = useState([]);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);

  const podeEstoque = pode('ver_estoque');
  const podeFinanceiro = pode('ver_financeiro');
  const podePedidos = pode('ver_pedidos');
  const linkAprovacaoGerencial = pode('aprovar_pedidos') || podeFinanceiro;

  const titulo = useMemo(() => {
    if (tipo === 'financeiro') return 'Alertas — Financeiro';
    if (tipo === 'pedidos') return 'Alertas — Pedidos';
    if (tipo === 'aprovacao') return 'Alertas — Engenharia';
    if (tipo === 'ferias') return 'Alertas — RH / Férias';
    return 'Alertas do Sistema';
  }, [tipo]);

  useEffect(() => {
    let mounted = true;

    if (tipo === 'aprovacao' || tipo === 'ferias') {
      setCritico([]);
      setSaldo({ totalVencidoPagar: 0 });
      setAguardando([]);
      setErro(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const consolidado = !tipo;
    const runFinancial = tipo === 'financeiro' || (consolidado && podeFinanceiro);
    const runEstoque = consolidado && podeEstoque;
    const runPedidos = tipo === 'pedidos' || (consolidado && podePedidos);

    (async () => {
      setLoading(true);
      try {
        const promises = [];

        if (runEstoque) {
          promises.push(
            fetchEstoqueCriticoApi().then((cri) => {
              if (mounted) setCritico(cri);
            }),
          );
        } else if (mounted) setCritico([]);

        if (runFinancial) {
          promises.push(
            fetchSaldoFinanceiroApi().then((sd) => {
              if (mounted) setSaldo(sd);
            }),
          );
        } else if (mounted) setSaldo({ totalVencidoPagar: 0 });

        if (runPedidos) {
          promises.push(
            fetchPedidosDraftParaAprovacaoPrisma().then((rows) => {
              if (mounted) setAguardando(rows);
            }),
          );
        } else if (mounted) setAguardando([]);

        await Promise.all(promises);
        if (mounted) setErro(null);
      } catch (e) {
        if (!mounted) return;
        setErro(e?.message || 'Falha ao carregar alertas');
        setCritico([]);
        setSaldo({ totalVencidoPagar: 0 });
        setAguardando([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tipo, podeEstoque, podeFinanceiro, podePedidos]);

  const alertas = useMemo(() => {
    if (tipo === 'aprovacao' || tipo === 'ferias') {
      return [
        {
          tipo: 'muted',
          icone: AlertTriangle,
          texto:
            tipo === 'ferias'
              ? 'Sem alertas de férias neste período.'
              : 'Sem alertas de engenharia neste período.',
          link: null,
        },
      ];
    }

    const consolidado = !tipo;
    const linhas = [];
    if (erro) {
      linhas.push({
        tipo: 'danger',
        icone: AlertTriangle,
        texto: erro,
        link: null,
      });
    }

    const showCritico =
      critico.length > 0 && podeEstoque && consolidado;
    const showSaldo =
      saldo.totalVencidoPagar > 0 &&
      podeFinanceiro &&
      (tipo === 'financeiro' || consolidado);
    const showAguardando =
      aguardando.length > 0 &&
      podePedidos &&
      (tipo === 'pedidos' || consolidado);

    if (showCritico) {
      linhas.push({
        tipo: 'danger',
        icone: AlertTriangle,
        texto: `${critico.length} produto(s) abaixo do mínimo`,
        link: '/estoque/produtos',
      });
    }
    if (showAguardando) {
      linhas.push({
        tipo: 'warning',
        icone: Clock,
        texto: `${aguardando.length} pedido(s) aguardando aprovação`,
        link: linkAprovacaoGerencial ? '/financeiro/aprovacao-pedidos' : '/vendas/pedidos',
      });
    }
    if (showSaldo) {
      linhas.push({
        tipo: 'warning',
        icone: DollarSign,
        texto: `${fmtR(saldo.totalVencidoPagar)} em contas vencidas`,
        link: '/financeiro/pagar',
      });
    }

    return linhas;
  }, [
    tipo,
    erro,
    critico.length,
    saldo.totalVencidoPagar,
    aguardando.length,
    podeEstoque,
    podeFinanceiro,
    podePedidos,
    linkAprovacaoGerencial,
  ]);

  const clsTipo = (t) =>
    t === 'danger'
      ? 'bg-red-50 text-red-700'
      : t === 'warning'
        ? 'bg-yellow-50 text-yellow-700'
        : t === 'muted'
          ? 'bg-muted/50 text-muted-foreground'
          : 'bg-green-50 text-green-700';

  return (
    <div className="bg-white border border-border rounded-lg h-full flex flex-col overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">{titulo}</h3>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading ? (
          <p className="text-xs text-muted-foreground py-2">Carregando…</p>
        ) : alertas.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Nenhum alerta no momento.</p>
        ) : (
          alertas.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 p-2 rounded text-xs ${clsTipo(a.tipo)}`}>
              <a.icone size={13} className="shrink-0 mt-0.5" />
              {a.link ? (
                <Link to={a.link} className="hover:underline">
                  {a.texto}
                </Link>
              ) : (
                <span>{a.texto}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
