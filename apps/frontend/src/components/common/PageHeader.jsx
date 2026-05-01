import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-muted-foreground" />}
                <span className={`text-[11px] ${i === breadcrumbs.length - 1 ? 'text-muted-foreground' : 'text-primary cursor-pointer hover:underline'}`}>
                  {b}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}