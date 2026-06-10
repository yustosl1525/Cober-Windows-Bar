import { Cpu } from "lucide-react";
import i18n from "../../../i18n";
import { useTranslation } from "react-i18next";
import type {
  DesktopResidentState,
  SystemPerformanceMetric,
  SystemPerformanceSourceQuality,
} from "../../../types/hub";

type ResidentStatusTemplateProps = {
  state: DesktopResidentState;
};

export function ResidentStatusTemplate({ state }: ResidentStatusTemplateProps) {
  const { t } = useTranslation();
  const sourceLabel = sourceQualityLabel(state.sourceStatus?.quality, t);

  return (
    <>
      <div className="product-status-icon product-status-icon-resident" aria-hidden="true">
        <Cpu size={20} strokeWidth={2.2} />
        <span
          className={`product-status-source-health ${sourceQualityClassName(state.sourceStatus?.quality)}`}
          aria-label={`${sourceLabel}`}
          title={sourceLabel}
        >
          <span />
          <span className="product-status-source-health-label">{sourceLabel}</span>
        </span>
      </div>

      <div className="product-status-metrics">
        {state.metrics.map((metric) => {
          const accent = metricAccent(metric);
          const label = t("metrics.usageRate", { label: metric.label, value: metric.value });

          return (
            <div
              className={`product-status-metric product-status-metric-${metric.tone}`}
              key={metric.id}
              aria-label={label}
              title={label}
            >
              <div className="product-status-label">
                <span className="product-status-label-name">{metric.label}</span>
                <strong>{metric.value}%</strong>
              </div>
              <span
                className="product-status-track"
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={metric.value}
              >
                <span
                  style={{
                    width: `${visibleMetricValue(metric.value)}%`,
                    background: accent,
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function visibleMetricValue(value: number) {
  return value <= 0 ? 10 : Math.max(value, 10);
}

type TranslationFn = (key: string) => string;

export function sourceQualityLabel(quality: SystemPerformanceSourceQuality | undefined, t?: TranslationFn) {
  const translate = t ?? i18n.t.bind(i18n);
  switch (quality) {
    case "live":
      return translate("diagnostics.live");
    case "stale":
      return translate("diagnostics.stale");
    case "unavailable":
      return translate("diagnostics.unavailable");
    case "fallback":
    default:
      return translate("diagnostics.fallback");
  }
}

export function sourceQualityClassName(quality: SystemPerformanceSourceQuality | undefined) {
  switch (quality) {
    case "live":
      return "is-live";
    case "stale":
      return "is-stale";
    case "unavailable":
      return "is-unavailable";
    case "fallback":
    default:
      return "is-fallback";
  }
}

function metricAccent(metric: SystemPerformanceMetric) {
  if (metric.value > 80) {
    return "linear-gradient(90deg, #f97316 0%, #ef4444 100%)";
  }

  if (metric.value >= 50) {
    switch (metric.tone) {
      case "blue":
        return "linear-gradient(90deg, #2f8fed 0%, #7dd3fc 100%)";
      case "violet":
        return "linear-gradient(90deg, #7c6cff 0%, #c084fc 100%)";
      case "cyan":
        return "linear-gradient(90deg, #0891b2 0%, #2dd4bf 100%)";
    }
  }

  switch (metric.tone) {
    case "blue":
      return "linear-gradient(90deg, #0f6cbd 0%, #60a5fa 100%)";
    case "violet":
      return "linear-gradient(90deg, #6d5dfc 0%, #a78bfa 100%)";
    case "cyan":
      return "linear-gradient(90deg, #0f766e 0%, #2dd4bf 100%)";
  }
}
