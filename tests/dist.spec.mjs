// The built files (npm run build): dist/spill.auto.js by a <script> tag — window.Spill, the plugins registered, the
// carousels built by their attributes — and the same global by hand
import { test, expect } from "@playwright/test";

test("dist: one <script>, a carousel by attributes and one by hand", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto("/tests/dist.html");
  await expect(page.locator("#auto [data-spill-viewport]")).toHaveAttribute("data-spill-axis", "x");
  expect(await page.evaluate(() => typeof window.Spill === "function" && typeof window.Spill.Autoplay === "function")).toBe(true);
  await page.locator("#next").click();
  await expect.poll(() => page.evaluate(() => window.Spill.SpillAuto.get(document.querySelector("#auto")).selectedScrollSnap())).toBe(1);
  await expect.poll(() => page.evaluate(() => document.querySelectorAll("#auto .is-snapped").length)).toBe(1);
  expect(await page.evaluate(() => [window.manual.scrollSnapList().length, typeof window.manual.plugins().autoplay.play])).toEqual([3, "function"]);
  expect(errors).toEqual([]);
});
