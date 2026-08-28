const puppeteer = require("puppeteer");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
const fs = require("fs");

const sleep = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
};

const delay = 10000 + Math.random() * 15000;

async function dismissCookieBanner(page) {
  const rejectTexts = [
    "essential cookies only",
    "reject all",
    "reject",
    "decline",
    "deny",
    "only essential",
    "necessary cookies only",
    "accept essential",
    "refuse",
    "disagree",
  ];

  // Try buttons and links that contain any of the reject phrases
  const clicked = await page.evaluate((texts) => {
    const candidates = Array.from(
      document.querySelectorAll("button, a, [role='button']"),
    );

    for (const el of candidates) {
      // Skip hidden elements
      if (el.offsetParent === null) continue;

      const text = (el.innerText || el.textContent || "").trim().toLowerCase();
      if (!text) continue;

      const isReject = texts.some((t) => text.includes(t));
      if (isReject) {
        el.click();
        console.log("clicked");
        return true;
      }
    }
    return false;
  }, rejectTexts);

  if (clicked) {
    // Give the banner time to disappear
    await sleep(1500 + Math.random() * 1000);
  }

  return clicked;
}

// function expression - parsed executed at line of expressions
const continueBrowser = async () => {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  return [browser, page];
};

async function getJobDescriptionText(page, url) {
  const bodyHTML = await page.evaluate(() => {
    return document.body.outerHTML;
  });

  const doc = new JSDOM(bodyHTML, {
    url,
  });

  const reader = new Readability(doc.window.document);
  const readabilityInfo = reader.parse();
  console.log(readabilityInfo);

  return readabilityInfo.textContent;
}

async function run() {
  const jobUrl = process.argv[2];
  if (!jobUrl || !jobUrl.startsWith("http")) {
    console.error("Invalid or missing URL:", jobUrl);
    process.exit(1);
  }

  console.log("Scraping given job...");

  const [browser, page] = await continueBrowser();

  await page.goto(jobUrl, { waitUntil: "domcontentloaded" });

  await sleep(delay);
  const jobDescription = await getJobDescriptionText(page, jobUrl);

  fs.writeFileSync("./jobe_descrip_temp.txt", jobDescription, "utf-8");

  console.log("Saved job description :)");
  browser.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
