import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
      <div className="min-w-0 flex-1">
        {breadcrumbs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-muted-foreground shrink-0" />}
                <span
                  className={`text-[11px] sm:text-sm ${i === breadcrumbs.length - 1 ? 'text-muted-foreground' : 'text-primary cursor-pointer hover:underline'}`}
                >
                  {b}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}