export type StatusRailAccent = "violet" | "green" | "orange";

type StatusRailProps = {
  value: number;
  label: string;
  accent: StatusRailAccent;
};

export function StatusRail({ value, label, accent }: StatusRailProps) {
  return (
    <span
      className={`product-status-track product-status-track-${accent}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${Math.max(12, Math.min(100, value))}%` }} />
    </span>
  );
}
