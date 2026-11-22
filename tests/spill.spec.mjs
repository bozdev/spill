// Spill: the core (snaps, moves, events, options, the mouse's drag, the observers, on and off), the plugins, the
// attributes. Every carousel on tests/fixture.html's stage: 10 slides of 200px in a 600px viewport (max scroll 1400).
import { test, expect } from "@playwright/test";

const isPhone = (testInfo) => testInfo.project.name === "phone";
const open = async (page) => {
  await page.goto("/tests/fixture.html");
  await page.waitForFunction(() => window.ready === true);
  // The mouse off the stage: one resting where a carousel is built gets a real mouseenter from the browser (Autoplay's
  // stopOnMouseEnter stops) — where it rests differs from one machine to another
  const size = page.viewportSize();
  await page.mouse.move((size?.width ?? 800) - 2, (size?.height ?? 600) - 2);
};
/** @param {import("@playwright/test").Page} page @param {object} [options] @param {string} [plugins] JS for the plugins array @param {number} [count] @param {string} [wrap] */
const mount = (page, options = {}, plugins = "[]", count = 10, wrap = "") =>
  page.evaluate(([options, plugins, count, wrap]) => window.mount(options, eval(plugins), count, wrap), [options, plugins, count, wrap]);
const scrollAt = (page) => page.evaluate(() => Math.round(window.api.rootNode().scrollLeft));
const settled = (page, at) => expect.poll(() => scrollAt(page), { timeout: 4000 }).toBe(at);

test.beforeEach(async ({ page }) => open(page));

test("the snaps: each slide's place, the ones the edges hold at the same place one (trimSnaps), 0 → 1", async ({ page }) => {
  await mount(page, { align: "start" });
  const list = await page.evaluate(() => window.api.scrollSnapList());
  expect(list.length).toBe(8);
  expect(list[0]).toBe(0);
  expect(list.at(-1)).toBe(1);
  expect(list[1]).toBeCloseTo(200 / 1400, 3);
  // The browser's snap points: each snap's first slide, its alignment its scroll margin
  expect(await page.evaluate(() => getComputedStyle(document.querySelector("#s1")).scrollSnapAlign)).toContain("start");
  expect(await page.evaluate(() => getComputedStyle(window.api.rootNode()).scrollSnapType)).toContain("mandatory");
  // keepSnaps: every one, the end's repeated
  await mount(page, { align: "start", containScroll: "keepSnaps" });
  expect(await page.evaluate(() => window.api.scrollSnapList().length)).toBe(10);
  // center: the slides centred, the edges trimmed
  await mount(page, { align: "center" });
  expect(await page.evaluate(() => window.api.scrollSnapList().length)).toBe(8);
});

test("the moves: next, prev, to (animated, or a jump), select then settle; can scroll next / prev at the edges", async ({ page }) => {
  await mount(page, { align: "start" });
  expect(await page.evaluate(() => [window.api.canScrollPrev(), window.api.canScrollNext()])).toEqual([false, true]);
  await page.evaluate(() => window.api.scrollNext());
  expect(await page.evaluate(() => [window.api.selectedScrollSnap(), window.api.previousScrollSnap()])).toEqual([1, 0]);
  await settled(page, 200);
  await expect.poll(() => page.evaluate(() => window.seen.includes("settle"))).toBe(true);
  expect(await page.evaluate(() => window.seen.filter((name) => name === "select").length)).toBe(1);
  await page.evaluate(() => window.api.scrollTo(5, true));
  expect(await scrollAt(page)).toBe(1000);
  await page.evaluate(() => window.api.scrollTo(99, true));
  expect(await page.evaluate(() => [window.api.selectedScrollSnap(), window.api.canScrollNext(), window.api.canScrollPrev()])).toEqual([7, false, true]);
  expect(await scrollAt(page)).toBe(1400);
  expect(await page.evaluate(() => window.api.scrollProgress())).toBe(1);
  await page.evaluate(() => window.api.scrollPrev(true));
  expect(await scrollAt(page)).toBe(1200);
  // Nothing moved by a transform: native scroll only
  expect(await page.evaluate(() => getComputedStyle(window.api.containerNode()).transform)).toBe("none");
});

test("options: slidesToScroll (a number, auto), startIndex, align end, containScroll false (room to centre the first), dragFree, axis y, direction rtl", async ({ page }) => {
  // 10 slides two at a time: 0, 400, 800, 1200 — and the end, 1400 (the last pair's own place is past it)
  await mount(page, { align: "start", slidesToScroll: 2 });
  expect(await page.evaluate(() => window.api.scrollSnapList().length)).toBe(5);
  await page.evaluate(() => window.api.scrollNext(true));
  expect(await scrollAt(page)).toBe(400);
  await mount(page, { align: "start", slidesToScroll: "auto" });
  expect(await page.evaluate(() => window.api.internalEngine().slideRegistry[0])).toEqual([0, 1, 2]);
  await mount(page, { align: "start", startIndex: 3 });
  expect(await scrollAt(page)).toBe(600);
  await mount(page, { align: "end" });
  expect(await page.evaluate(() => window.api.scrollSnapList().length)).toBe(8);
  // containScroll false: the first slide can sit in the middle
  await mount(page, { align: "center", containScroll: false });
  const first = await page.evaluate(() => {
    const box = window.api.rootNode().getBoundingClientRect();
    const slide = document.querySelector("#s0").getBoundingClientRect();
    return Math.round(slide.left + slide.width / 2 - (box.left + box.width / 2));
  });
  expect(first).toBe(0);
  expect(await page.evaluate(() => window.api.scrollSnapList().length)).toBe(10);
  // dragFree: no snapping
  await mount(page, { dragFree: true });
  expect(await page.evaluate(() => getComputedStyle(window.api.rootNode()).scrollSnapType)).toBe("none");
  // A column
  await mount(page, { axis: "y", align: "start" }, "[]", 10, "vertical");
  await page.evaluate(() => window.api.scrollTo(2, true));
  expect(await page.evaluate(() => Math.round(window.api.rootNode().scrollTop))).toBe(200);
  // Right to left
  await mount(page, { align: "start", direction: "rtl" });
  await page.evaluate(() => {
    window.api.rootNode().setAttribute("dir", "rtl");
    window.api.reInit();
    window.api.scrollTo(2, true);
  });
  expect(await page.evaluate(() => Math.round(Math.abs(window.api.rootNode().scrollLeft)))).toBe(400);
});

test("a mouse drags it: past the threshold, one snap at most (skipSnaps off), the click it ends with swallowed; a short press is a click", async ({ page }, testInfo) => {
  test.skip(isPhone(testInfo), "a mouse's");
  await mount(page, { align: "start" });
  const box = await page.locator("#viewport").boundingBox();
  const y = box.y + 60;
  await page.mouse.move(box.x + 500, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, y, { steps: 8 });
  expect(await page.evaluate(() => window.api.rootNode().hasAttribute("data-spill-dragging"))).toBe(true);
  await page.mouse.up();
  await settled(page, 200);
  expect(await page.evaluate(() => window.api.selectedScrollSnap())).toBe(1);
  expect(await page.evaluate(() => window.seen.includes("pointerDown") && window.seen.includes("pointerUp"))).toBe(true);
  expect(page.url()).not.toContain("#go-");
  // A press without a move: the link's click
  await page.locator("#a2").click();
  await expect(page).toHaveURL(/#go-2$/);
  // watchDrag off: no drag, no scroll by hand
  await mount(page, { watchDrag: false });
  expect(await page.evaluate(() => getComputedStyle(window.api.rootNode()).overflowX)).toBe("hidden");
});

test("observers: slides in view, a slide added (slidesChanged), a new size (resize — the snap kept), a focus (slideFocus)", async ({ page }) => {
  await mount(page, { align: "start" });
  await expect.poll(() => page.evaluate(() => window.api.slidesInView())).toEqual([0, 1, 2]);
  expect(await page.evaluate(() => window.api.slidesNotInView().length)).toBe(7);
  await page.evaluate(() => {
    const slide = document.createElement("div");
    slide.className = "slide";
    document.querySelector("#row").append(slide);
  });
  await expect.poll(() => page.evaluate(() => window.api.slideNodes().length)).toBe(11);
  expect(await page.evaluate(() => window.seen.includes("slidesChanged") && window.seen.includes("reInit"))).toBe(true);
  await page.evaluate(() => window.api.scrollTo(2, true));
  await page.evaluate(() => (document.querySelector("#viewport").style.width = "400px"));
  await expect.poll(() => page.evaluate(() => window.seen.includes("resize"))).toBe(true);
  expect(await scrollAt(page)).toBe(400);
  // A focus on a slide out of view brings its snap
  await mount(page, { align: "start" });
  await page.locator("#a6").focus();
  await expect.poll(() => page.evaluate(() => window.api.selectedScrollSnap())).toBe(6);
  expect(await page.evaluate(() => window.seen.includes("slideFocus"))).toBe(true);
});

test("on and off: breakpoints (active), reInit keeps the snap, destroy leaves the markup as it was", async ({ page }) => {
  await mount(page, { breakpoints: { "(min-width: 1px)": { active: false } } });
  expect(await page.evaluate(() => window.api.rootNode().hasAttribute("data-spill-viewport"))).toBe(false);
  await mount(page, { align: "start", breakpoints: { "(min-width: 99999px)": { active: false } } });
  expect(await page.evaluate(() => window.api.rootNode().hasAttribute("data-spill-viewport"))).toBe(true);
  await page.evaluate(() => window.api.scrollTo(3, true));
  await page.evaluate(() => window.api.reInit({ align: "end" }));
  expect(await page.evaluate(() => [window.api.selectedScrollSnap(), window.api.internalEngine().options.align, window.seen.includes("reInit")])).toEqual([3, "end", true]);
  await page.evaluate(() => window.api.destroy());
  const left = await page.evaluate(() => ({
    viewport: document.querySelector("#viewport").getAttribute("style"),
    attributes: [...document.querySelector("#viewport").attributes].map((attribute) => attribute.name),
    slide: document.querySelector("#s1").getAttribute("style"),
  }));
  expect(left.viewport ?? "").toBe("");
  expect(left.attributes).toEqual(["class", "id"]);
  expect(left.slide ?? "").toBe("");
  await expect.poll(() => page.evaluate(() => window.seen.includes("destroy"))).toBe(true);
});

test("plugins: Autoplay (the next snap in time, back to the first, stops on a press), ClassNames, AutoHeight", async ({ page }, testInfo) => {
  await mount(page, { align: "start" }, "[Autoplay({ delay: 250, jump: true })]");
  // The snaps it selects, in order (sampling a carousel that moves by itself would miss some under load)
  await page.evaluate(() => {
    window.snaps = [];
    window.api.on("select", (api) => window.snaps.push(api.selectedScrollSnap()));
  });
  await expect.poll(() => page.evaluate(() => window.snaps.length)).toBeGreaterThan(1);
  expect(await page.evaluate(() => window.snaps[1] - window.snaps[0])).toBe(1);
  expect(await page.evaluate(() => window.api.plugins().autoplay.isPlaying())).toBe(true);
  expect(await page.evaluate(() => typeof window.api.plugins().autoplay.timeUntilNext())).toBe("number");
  // At the last snap: back to the first
  await page.evaluate(() => {
    window.snaps = [];
    window.api.scrollTo(7, true);
  });
  await expect.poll(() => page.evaluate(() => window.snaps.slice(0, 2).join(","))).toBe("7,0");
  if (!isPhone(testInfo)) {
    await page.locator("#viewport").dispatchEvent("pointerdown", { pointerType: "mouse", button: 0 });
    expect(await page.evaluate(() => window.api.plugins().autoplay.isPlaying())).toBe(false);
  }
  await mount(page, { align: "start" }, "[ClassNames()]");
  await expect.poll(() => page.evaluate(() => document.querySelector("#s0").classList.contains("is-snapped"))).toBe(true);
  await expect.poll(() => page.evaluate(() => document.querySelector("#s2").classList.contains("is-in-view"))).toBe(true);
  expect(await page.evaluate(() => window.api.rootNode().classList.contains("is-draggable"))).toBe(true);
  await page.evaluate(() => window.api.scrollTo(1, true));
  expect(await page.evaluate(() => [document.querySelector("#s0").classList.contains("is-snapped"), document.querySelector("#s1").classList.contains("is-snapped")])).toEqual([false, true]);
  await mount(page, { align: "start" }, "[AutoHeight()]", 10, "heights");
  expect(await page.evaluate(() => window.api.containerNode().style.height)).toBe("120px");
  await page.evaluate(() => window.api.scrollTo(1, true));
  expect(await page.evaluate(() => window.api.containerNode().style.height)).toBe("220px");
});

test("attributes: built by itself, its controls inside or elsewhere (data-spill-for), dots, progress, to, play, the words a screen reader hears", async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector("#stage").innerHTML = `
      <section id="gallery" data-spill-carousel='{"align":"start"}' data-spill-plugins="autoplay" data-spill-autoplay='{"playOnInit":false,"delay":200,"jump":true}'>
        <div data-spill-viewport class="viewport"><div class="row">${Array.from({ length: 10 }, (_, index) => `<div class="slide">${index + 1}</div>`).join("")}</div></div>
        <button data-spill-prev>‹</button><button data-spill-next id="next">›</button>
        <div data-spill-dots="number" id="dots"></div>
        <div data-spill-progress id="bar"></div>
        <button data-spill-to="4" id="to4">4</button>
        <button data-spill-play id="play">play</button>
      </section>
      <button data-spill-next data-spill-for="gallery" id="outside">next, from outside</button>`;
    window.readyEvent = false;
    document.querySelector("#gallery").addEventListener("spill:ready", () => (window.readyEvent = true));
    window.SpillAuto.scan();
  });
  const api = () => "window.SpillAuto.get(document.querySelector('#gallery'))";
  expect(await page.evaluate(() => window.readyEvent)).toBe(true);
  await expect(page.locator("[data-spill-prev]")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("[data-spill-prev]")).toHaveAttribute("aria-label", "Previous slide");
  await expect(page.locator("#dots > button")).toHaveCount(8);
  await expect(page.locator("#dots > button").first()).toHaveAttribute("aria-current", "true");
  await expect(page.locator("#dots > button").first()).toHaveText("1");
  await expect(page.locator("#gallery")).toHaveAttribute("aria-roledescription", "carousel");
  await expect(page.locator("#gallery .slide").first()).toHaveAttribute("aria-label", "1 of 10");
  await page.locator("#outside").click();
  await expect.poll(() => page.evaluate((code) => eval(code).selectedScrollSnap(), api())).toBe(1);
  await page.locator("#to4").click();
  await expect.poll(() => page.evaluate((code) => eval(code).selectedScrollSnap(), api())).toBe(3);
  await expect(page.locator("#dots > button").nth(3)).toHaveAttribute("aria-current", "true");
  await expect.poll(() => page.evaluate(() => Number(document.querySelector("#bar").style.getPropertyValue("--spill-progress")))).toBeGreaterThan(0);
  await page.locator("#dots > button").nth(7).click();
  await expect(page.locator("#next")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#play")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#play").click();
  await expect(page.locator("#play")).toHaveAttribute("aria-pressed", "true");
  await page.locator("#play").click();
  await expect(page.locator("#play")).toHaveAttribute("aria-pressed", "false");
  // Forgotten (a page leaving): the carousel down, what it wrote gone
  await page.evaluate(() => window.SpillAuto.forget([document.querySelector("#stage")]));
  await expect(page.locator("#dots > button")).toHaveCount(0);
  expect(await page.evaluate(() => document.querySelector("#gallery").hasAttribute("aria-roledescription"))).toBe(false);
  expect(await page.evaluate((code) => eval(code), api())).toBe(null);
});

test("a new size, as Embla: reInit, then resize — a row that comes to fit loses its arrows and dots, one that runs past them again gets them back; a slide only taller is no resize", async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector("#stage").innerHTML = `
      <section id="gallery" data-spill-carousel='{"align":"start"}'>
        <div data-spill-viewport class="viewport" id="viewport"><div class="row">${Array.from({ length: 4 }, (_, index) => `<div class="slide">${index + 1}</div>`).join("")}</div></div>
        <button data-spill-prev id="prev">‹</button><button data-spill-next id="next">›</button>
        <div data-spill-dots id="dots"></div>
      </section>`;
    window.SpillAuto.scan();
    window.heard = [];
    const api = window.SpillAuto.get(document.querySelector("#gallery"));
    for (const name of ["reInit", "resize"]) api.on(name, () => window.heard.push(name));
  });
  // 4 slides of 200px in 600px: two snaps (0, 200)
  await expect(page.locator("#next")).toHaveAttribute("aria-disabled", "false");
  await expect(page.locator("#dots > button")).toHaveCount(2);
  // 800px: all four fit — one snap, nowhere to go
  await page.evaluate(() => (document.querySelector("#viewport").style.width = "800px"));
  await expect(page.locator("#next")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#dots > button")).toHaveCount(1);
  expect(await page.evaluate(() => window.heard.slice(0, 2))).toEqual(["reInit", "resize"]);
  // 500px: three snaps (0, 200, 300), the arrow back
  await page.evaluate(() => (document.querySelector("#viewport").style.width = "500px"));
  await expect(page.locator("#next")).toHaveAttribute("aria-disabled", "false");
  await expect(page.locator("#dots > button")).toHaveCount(3);
  // Taller slides in a row (its width the same): no resize, no reInit
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.heard.length);
  await page.evaluate(() => document.querySelectorAll("#gallery .slide").forEach((slide) => (slide.style.height = "200px")));
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.heard.length)).toBe(before);
});

test("containScroll: false — room before the first snap and after the last: every slide can be centered, slides sized in % keep their size, nothing left behind", async ({ page }) => {
  await mount(page, { containScroll: false }, "[]", 5, "percent");
  const state = () =>
    page.evaluate(() => {
      const viewport = document.querySelector("#viewport").getBoundingClientRect();
      const slides = [...document.querySelectorAll("#row .slide")].map((slide) => slide.getBoundingClientRect());
      return { width: Math.round(slides[0].width), off: slides.map((slide) => Math.round(slide.left + slide.width / 2 - (viewport.left + viewport.width / 2))) };
    });
  // 70% of 600px: the room doesn't shrink them
  expect((await state()).width).toBe(420);
  expect(await page.evaluate(() => window.api.scrollSnapList().length)).toBe(5);
  for (const index of [0, 4, 2]) {
    await page.evaluate((at) => window.api.scrollTo(at, true), index);
    await expect.poll(async () => Math.abs((await state()).off[index])).toBeLessThanOrEqual(1);
  }
  await page.evaluate(() => window.api.destroy());
  expect(await page.evaluate(() => [document.querySelector("#row").hasAttribute("data-spill-room"), document.querySelector("#row").hasAttribute("style")])).toEqual([false, false]);
});

test("pointerUp follows every pointerDown: a finger, a pen, a right click, a cancelled press, with watchDrag off", async ({ page }) => {
  await mount(page, { watchDrag: false });
  const press = (type, button = 0, end = "pointerup") =>
    page.evaluate(
      ([type, button, end]) => {
        window.seen = [];
        const init = { bubbles: true, pointerId: 7, pointerType: type, button, isPrimary: true };
        document.querySelector("#viewport").dispatchEvent(new PointerEvent("pointerdown", init));
        window.dispatchEvent(new PointerEvent(end, init));
        return window.seen.filter((name) => name.startsWith("pointer"));
      },
      [type, button, end],
    );
  expect(await press("touch")).toEqual(["pointerDown", "pointerUp"]);
  expect(await press("pen")).toEqual(["pointerDown", "pointerUp"]);
  expect(await press("mouse", 2)).toEqual(["pointerDown", "pointerUp"]);
  expect(await press("touch", 0, "pointercancel")).toEqual(["pointerDown", "pointerUp"]);
  // A mouse's drag (watchDrag on): one pointerUp, not two
  await mount(page, { align: "start" });
  expect(await press("mouse")).toEqual(["pointerDown", "pointerUp"]);
});

test("ClassNames follows a new size: the snaps regrouped (reInit), the selected snap's slides marked again", async ({ page }) => {
  await mount(page, { align: "start", slidesToScroll: "auto" }, "[ClassNames()]");
  const marked = () => page.evaluate(() => [...document.querySelectorAll("#row .slide")].flatMap((slide, index) => (slide.classList.contains("is-snapped") ? [index] : [])));
  const registered = () => page.evaluate(() => window.api.internalEngine().slideRegistry[window.api.selectedScrollSnap()]);
  await page.evaluate(() => window.api.scrollTo(1, true));
  await expect.poll(marked).toEqual([3, 4, 5]);
  await page.evaluate(() => (document.querySelector("#viewport").style.width = "400px"));
  await expect.poll(() => page.evaluate(() => window.api.internalEngine().slideRegistry[0].length)).toBe(2);
  expect(await marked()).toEqual(await registered());
});

test("attributes: words left out of SpillAuto.words stay English", async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector("#stage").innerHTML = `
      <section id="words" data-spill-carousel>
        <div data-spill-viewport class="viewport"><div class="row">${Array.from({ length: 6 }, (_, index) => `<div class="slide">${index + 1}</div>`).join("")}</div></div>
        <button data-spill-prev id="prev">‹</button><button data-spill-next id="next">›</button>
      </section>`;
    window.SpillAuto.words = { prev: "Zurück", slide: "{0} von {1}" };
    window.SpillAuto.scan();
  });
  await expect(page.locator("#prev")).toHaveAttribute("aria-label", "Zurück");
  await expect(page.locator("#next")).toHaveAttribute("aria-label", "Next slide");
  await expect(page.locator("#words .slide").first()).toHaveAttribute("aria-label", "1 von 6");
  await expect(page.locator("#words")).toHaveAttribute("aria-roledescription", "carousel");
});

test("settle once a move: its last frame's scroll event is no new move", async ({ page }) => {
  await mount(page, { align: "start" });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    window.seen = [];
    window.api.scrollNext();
  });
  await expect.poll(() => page.evaluate(() => window.seen.filter((name) => name === "settle").length)).toBe(1);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.seen.filter((name) => name === "settle").length)).toBe(1);
  // A jump too
  await page.evaluate(() => {
    window.seen = [];
    window.api.scrollTo(4, true);
  });
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.seen.filter((name) => name === "settle").length)).toBeLessThanOrEqual(1);
});

test("destroy leaves an author's data-spill-viewport: SpillAuto builds the same carousel again after forget", async ({ page }) => {
  await page.evaluate(() => {
    document.querySelector("#stage").innerHTML = `
      <section id="again" data-spill-carousel='{"align":"start"}'>
        <div data-spill-viewport class="viewport" id="again-viewport"><div class="row">${Array.from({ length: 6 }, (_, index) => `<div class="slide">${index + 1}</div>`).join("")}</div></div>
      </section>`;
    window.SpillAuto.scan();
  });
  const viewportOf = () => page.evaluate(() => window.SpillAuto.get(document.querySelector("#again"))?.rootNode().id ?? null);
  expect(await viewportOf()).toBe("again-viewport");
  await page.evaluate(() => window.SpillAuto.forget([document.querySelector("#stage")]));
  expect(await page.evaluate(() => document.querySelector("#again-viewport").hasAttribute("data-spill-viewport"))).toBe(true);
  await page.evaluate(() => window.SpillAuto.scan());
  expect(await viewportOf()).toBe("again-viewport");
  // A viewport Spill marked itself is left unmarked
  await mount(page);
  await page.evaluate(() => window.api.destroy());
  expect(await page.evaluate(() => document.querySelector("#viewport").hasAttribute("data-spill-viewport"))).toBe(false);
});

test("Autoplay with stopOnMouseEnter: the mouse leaving starts it again — unless a press came while the mouse was over it", async ({ page }) => {
  await mount(page, { align: "start" }, "[Autoplay({ delay: 5000, stopOnMouseEnter: true })]");
  const playing = () => page.evaluate(() => window.api.plugins().autoplay.isPlaying());
  const send = (type) =>
    page.evaluate((type) => {
      const viewport = document.querySelector("#viewport");
      if (type === "press") {
        const init = { bubbles: true, pointerId: 3, pointerType: "mouse", button: 0, isPrimary: true };
        viewport.dispatchEvent(new PointerEvent("pointerdown", init));
        window.dispatchEvent(new PointerEvent("pointerup", init));
      } else viewport.dispatchEvent(new MouseEvent(type));
    }, type);
  expect(await playing()).toBe(true);
  await send("mouseenter");
  expect(await playing()).toBe(false);
  await send("mouseleave");
  expect(await playing()).toBe(true);
  // A press while the mouse is over it: stopped for good (stopOnInteraction, the default)
  await send("mouseenter");
  await send("press");
  await send("mouseleave");
  expect(await playing()).toBe(false);
});

test("a new size right after a rebuild is heard: the new observer's first report isn't skipped when a size changed", async ({ page }) => {
  await mount(page, { align: "start" });
  await page.waitForTimeout(200);
  await page.evaluate(async () => {
    window.seen = [];
    const slide = document.createElement("div");
    slide.className = "slide";
    document.querySelector("#row").append(slide);
    // The slide's MutationObserver rebuilds it first (a microtask) — then, before a frame, a new size
    await Promise.resolve();
    await Promise.resolve();
    window.api.scrollTo(2, true);
    document.querySelector("#viewport").style.width = "400px";
  });
  await expect.poll(() => page.evaluate(() => window.seen.includes("resize"))).toBe(true);
  await expect.poll(() => scrollAt(page)).toBe(400);
});

test("a finger: native scroll — the browser's own (overflow, snap points), nothing in the way", async ({ page }) => {
  await mount(page, { align: "start" });
  const style = await page.evaluate(() => {
    const view = getComputedStyle(window.api.rootNode());
    return { overflow: view.overflowX, snap: view.scrollSnapType, touch: view.touchAction };
  });
  expect(style.overflow).toBe("auto");
  expect(style.snap).toContain("mandatory");
  expect(style.touch).toBe("auto");
});
