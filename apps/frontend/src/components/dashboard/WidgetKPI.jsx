import { TrendingUp, TrendingDown } from 'lucide-react';

export default function WidgetKPI({ label, value, sub, icon: Icon, trend, trendVal, badge }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 relative h-full flex flex-col justify-between">
      {badge != null && badge > 0 && (
        <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-xl font-bold text-foreground truncate">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
        </div>
        <div className="w-9 h-9 cozinha-blue-bg rounded-lg flex items-center justify-center shrink-0 ml-2">
          <Icon size={16} className="text-white" />
        </div>
      </div>
      {trendVal && (
        <div className={`flex items-center gap-1 mt-2 text-[11px] font-medium ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
          {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendVal} vs mês anterior
        </div>
      )}
    </div>
  );
}