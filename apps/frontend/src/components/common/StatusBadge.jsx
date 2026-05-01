const statusMap = {
  // Pedido Venda
  'Orçamento': 'bg-gray-100 text-gray-600',
  'Aprovado': 'bg-blue-100 text-blue-700',
  'Em Produção': 'bg-orange-100 text-orange-700',
  'Faturado': 'bg-purple-100 text-purple-700',
  'Entregue': 'bg-green-100 text-green-700',
  // Genéricos
  'Ativo': 'bg-green-100 text-green-700',
  'Inativo': 'bg-gray-100 text-gray-600',
  'Bloqueado': 'bg-red-100 text-red-700',
  'Cancelado': 'bg-red-100 text-red-700',
  // Produção
  'Aberta': 'bg-blue-100 text-blue-700',
  'Em Andamento': 'bg-orange-100 text-orange-700',
  'Pausada': 'bg-yellow-100 text-yellow-700',
  'Concluída': 'bg-green-100 text-green-700',
  // Financeiro
  'Aberto': 'bg-blue-100 text-blue-700',
  'Pago': 'bg-green-100 text-green-700',
  'Vencido': 'bg-red-100 text-red-700',
  // Compras
  'Rascunho': 'bg-gray-100 text-gray-600',
  'Enviada': 'bg-blue-100 text-blue-700',
  'Parcialmente Recebida': 'bg-yellow-100 text-yellow-700',
  'Recebida': 'bg-green-100 text-green-700',
  // Aprovação
  'Aguardando Aprovação': 'bg-orange-100 text-orange-700',
  // Prioridade
  'Urgente': 'bg-red-100 text-red-700',
  'Alta': 'bg-orange-100 text-orange-700',
  'Normal': 'bg-blue-100 text-blue-700',
  'Baixa': 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }) {
  const cls = statusMap[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  );
}