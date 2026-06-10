import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { getDesktopStatusTemplateDescriptors, getDesktopStatusSettingsCopy } from "../../../data/desktopStatusConfig";
import type { DesktopStatusKind, DesktopStatusPreferences } from "../../../types/hub";

export type SettingsPanelProps = {
  preferences: DesktopStatusPreferences;
  activeStatusKind: DesktopStatusKind | null;
  autostartEnabled: boolean;
  onToggleAlwaysFloat: () => void;
  onToggleAvoidFullscreen: () => void;
  onToggleLockPosition: () => void;
  onToggleAutostart: () => void;
  onKindSelect: (kind: DesktopStatusKind) => void;
  onRefresh: () => void;
  onResetPosition: () => void;
  onOpenNativeSettings: () => void;
  onRecallStatusCenter: () => void;
  onClose: () => void;
};

function settingsToggleClassName(active: boolean) {
  return [
    "product-settings-toggle",
    active ? "is-active" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function SettingsPanel({
  preferences,
  activeStatusKind,
  autostartEnabled,
  onToggleAlwaysFloat,
  onToggleAvoidFullscreen,
  onToggleLockPosition,
  onToggleAutostart,
  onKindSelect,
  onRefresh,
  onResetPosition,
  onOpenNativeSettings,
  onRecallStatusCenter,
  onClose,
}: SettingsPanelProps) {
  const { t, i18n: i18nInstance } = useTranslation();
  const settingsCopy = getDesktopStatusSettingsCopy();
  const templateDescriptors = useMemo(() => getDesktopStatusTemplateDescriptors(), [i18nInstance.language]);

  return (
    <aside
      className="product-settings-panel"
      role="dialog"
      aria-label={settingsCopy.panel.ariaLabel}
    >
      <header className="product-settings-panel__header">
        <div>
          <h2>{settingsCopy.panel.title}</h2>
          <p>{settingsCopy.panel.description}</p>
        </div>
        <button
          type="button"
          className="product-settings-panel__close"
          onClick={onClose}
          aria-label={settingsCopy.panel.closeLabel}
        >
          <X size={18} strokeWidth={2.1} />
        </button>
      </header>

      <div className="product-settings-panel__body">
        <section className="product-settings-section">
          <h3>{settingsCopy.sections.windowBehavior}</h3>
          <div className="product-settings-toggle-grid">
            <button
              type="button"
              className={settingsToggleClassName(preferences.alwaysFloat)}
              onClick={onToggleAlwaysFloat}
            >
              <strong>{settingsCopy.toggles.alwaysFloat.title}</strong>
              <span>{settingsCopy.toggles.alwaysFloat.description}</span>
              <small>
                {preferences.alwaysFloat
                  ? settingsCopy.toggles.alwaysFloat.activeLabel
                  : settingsCopy.toggles.alwaysFloat.inactiveLabel}
              </small>
            </button>
            <button
              type="button"
              className={settingsToggleClassName(preferences.avoidFullscreen)}
              onClick={onToggleAvoidFullscreen}
            >
              <strong>{settingsCopy.toggles.avoidFullscreen.title}</strong>
              <span>{settingsCopy.toggles.avoidFullscreen.description}</span>
              <small>
                {preferences.avoidFullscreen
                  ? settingsCopy.toggles.avoidFullscreen.activeLabel
                  : settingsCopy.toggles.avoidFullscreen.inactiveLabel}
              </small>
            </button>
            <button
              type="button"
              className={settingsToggleClassName(preferences.lockPosition)}
              onClick={onToggleLockPosition}
            >
              <strong>{settingsCopy.toggles.lockPosition.title}</strong>
              <span>{settingsCopy.toggles.lockPosition.description}</span>
              <small>
                {preferences.lockPosition
                  ? settingsCopy.toggles.lockPosition.activeLabel
                  : settingsCopy.toggles.lockPosition.inactiveLabel}
              </small>
            </button>
            <button
              type="button"
              className={settingsToggleClassName(autostartEnabled)}
              onClick={onToggleAutostart}
            >
              <strong>{t("settings.toggles.autostart.title")}</strong>
              <span>{t("settings.toggles.autostart.description")}</span>
              <small>
                {autostartEnabled
                  ? t("settings.toggles.autostart.activeLabel")
                  : t("settings.toggles.autostart.inactiveLabel")}
              </small>
            </button>
          </div>
        </section>

        <section className="product-settings-section">
          <h3>{settingsCopy.sections.statusTemplates}</h3>
          <div className="product-settings-template-grid">
            {templateDescriptors.map((descriptor) => {
              const isActive = descriptor.kind === activeStatusKind;
              return (
                <button
                  key={descriptor.kind}
                  type="button"
                  className={settingsToggleClassName(isActive)}
                  onClick={() => onKindSelect(descriptor.kind)}
                >
                  <strong>{descriptor.label}</strong>
                  <span>{descriptor.description}</span>
                  <small>{descriptor.providerHint}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="product-settings-section">
          <h3>{t("settings.language.title")}</h3>
          <div className="product-settings-toggle-grid">
            <button
              type="button"
              className={settingsToggleClassName(i18nInstance.language === "zh-CN")}
              onClick={() => void i18nInstance.changeLanguage("zh-CN")}
            >
              <strong>{t("settings.language.zh-CN")}</strong>
              <small>{i18nInstance.language === "zh-CN" ? t("common.enabled") : t("common.disabled")}</small>
            </button>
            <button
              type="button"
              className={settingsToggleClassName(i18nInstance.language === "en")}
              onClick={() => void i18nInstance.changeLanguage("en")}
            >
              <strong>{t("settings.language.en")}</strong>
              <small>{i18nInstance.language === "en" ? t("common.enabled") : t("common.disabled")}</small>
            </button>
          </div>
        </section>

        <section className="product-settings-section">
          <h3>{settingsCopy.actions.quickPanelTitle}</h3>
          <p className="product-settings-section__hint">{settingsCopy.actions.quickPanelDescription}</p>
          <div className="product-settings-actions">
            <button type="button" className="product-settings-btn" onClick={onRefresh}>
              {settingsCopy.actions.refresh}
            </button>
            <button type="button" className="product-settings-btn" onClick={onResetPosition}>
              {settingsCopy.actions.resetPosition}
            </button>
            <button type="button" className="product-settings-btn" onClick={onOpenNativeSettings}>
              {settingsCopy.actions.openNativeSettings}
            </button>
            <button type="button" className="product-settings-btn" onClick={onRecallStatusCenter}>
              {settingsCopy.actions.recallStatusCenter}
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
