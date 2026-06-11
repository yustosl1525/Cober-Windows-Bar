import { strict as assert } from "node:assert";
import i18n from "../i18n";
import {
  getDesktopStatusTemplateDescriptors,
  createDesktopStatusStateTemplates,
  createSystemPerformanceMetricSnapshot,
  getDesktopStatusLabels,
  getDesktopStatusShellCopy,
  getDesktopStatusSettingsCopy,
} from "./desktopStatusConfig";
import { systemPerformanceMetrics } from "./mockHubData";

// Set language BEFORE getDesktopStatusLabels() runs.
i18n.changeLanguage("zh-CN");

const mojibakePattern = /[�锟俙粨鏉ㄨ浣冪彂餃墐敷]/;

// systemPerformanceMetrics is built from getDesktopStatusLabels() in
// desktopStatusConfig; after i18n.changeLanguage above, verify the
// labels match the Chinese translations.
const labels = getDesktopStatusLabels();
const cpuLabel = labels.cpu;
const memoryLabel = labels.memory;
const downloadLabel = labels.download;
const uploadLabel = labels.upload;

assert.equal(cpuLabel, "CPU");
assert.equal(memoryLabel, "内存");
assert.equal(downloadLabel, "下载");
assert.equal(uploadLabel, "上传");

const labelsToCheck = [
  cpuLabel,
  memoryLabel,
  downloadLabel,
  uploadLabel,
  getDesktopStatusShellCopy().ariaLabel,
  getDesktopStatusSettingsCopy().panel.title,
  ...getDesktopStatusTemplateDescriptors().flatMap((d) => [d.label, d.description]),
  ...Object.values(
    createDesktopStatusStateTemplates(
      createSystemPerformanceMetricSnapshot({
        cpu: 17,
        memory: 61,
        downloadSpeed: 2_457_600,
        uploadSpeed: 512_000,
      }),
    ),
  ).flatMap((t) => [t.title, t.subtitle, ...(t.detail ? [t.detail] : []), ...(t.sessionLabel ? [t.sessionLabel] : [])]),
];

for (const label of labelsToCheck) {
  assert.equal(mojibakePattern.test(label), false, `${label} must not be mojibake`);
}

console.log("ok desktop status config copy stays readable");
