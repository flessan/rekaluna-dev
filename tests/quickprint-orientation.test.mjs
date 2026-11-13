import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/features/quickprint/QuickPrintPage.tsx", import.meta.url), "utf8");

test("editing canvas dimensions follow the selected orientation without rotating objects", () => {
  assert.match(source, /const paperWidth = prefs\.orientation === "portrait" \? paper\.w : paper\.h;/);
  assert.match(source, /const paperHeight = prefs\.orientation === "portrait" \? paper\.h : paper\.w;/);
  assert.match(source, /const changeOrientationMode = \(orientation: Orientation\) => \{\s*if \(orientation === prefs\.orientation\) return;\s*setPrefs\(\{ orientation \}\);\s*\};/);

  const orientationHandler = source.slice(
    source.indexOf("const changeOrientationMode"),
    source.indexOf("const printSheet", source.indexOf("const changeOrientationMode")),
  );
  assert.doesNotMatch(orientationHandler, /commit\(|rotation:|\.rotation\s*=/);
});

test("landscape printing rotates the complete composition onto portrait paper", () => {
  const printStart = source.indexOf("const printSheet");
  const printEnd = source.indexOf("window.addEventListener(\"rekaluna:print-sheet\"", printStart);
  const printImplementation = source.slice(printStart, printEnd);

  assert.match(source, /const printPaperWidth = paper\.w;/);
  assert.match(source, /const printPaperHeight = paper\.h;/);
  assert.match(printImplementation, /@page \{ size: \$\{printPaperWidth\}mm \$\{printPaperHeight\}mm; margin: 0; \}/);
  assert.match(printImplementation, /const printRoot = source\.cloneNode\(true\) as HTMLElement;/);
  assert.match(printImplementation, /printRoot\.style\.transform = landscapePrint \? "translate\(-50%, -50%\) rotate\(90deg\)" : "none";/);
  assert.match(printImplementation, /transform: \$\{landscapePrint \? "translate\(-50%, -50%\) rotate\(90deg\)" : "none"\} !important;/);
  assert.doesNotMatch(printImplementation, /\.canvas-object[^\n]*transform\s*=/);
});
