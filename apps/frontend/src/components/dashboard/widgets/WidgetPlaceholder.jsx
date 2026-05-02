import { Construction } from 'lucide-react';
import { ALL_WIDGETS } from '@/services/dashboardConfig';

export default function WidgetPlaceholder({ widgetId }) {
  const meta = ALL_WIDGETS.find((w) => w.id === widgetId);
  const title = meta?.label || widgetId;

  return (
    <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center">
      <Construction className="h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground">Em desenvolvimento</p>
    </div>
  );
}
