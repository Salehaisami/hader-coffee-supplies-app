import { type ReactNode } from "react";

/**
 * Consistent page header used across dashboard pages. Renders a title and an
 * optional supporting description with the dashboard's Stone/Ink styling.
 */
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 border-b border-stone-200 bg-white px-4 sm:px-8 py-4 sm:py-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
