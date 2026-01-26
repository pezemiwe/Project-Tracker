import { cn } from "../../lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="h4 text-foreground relative inline-block">
            {title}
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent/0" />
          </h2>
          {description && (
            <p className="text-small mt-1">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
