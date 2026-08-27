/*
Generic

we will enter a number of different plstforms and do job searches for "Software Engineer"
- linkdedin
- indeed
- another free one   

we will keep scraping till we get a lot of data

*/

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
const setupBrowser = async () => {
  const viewportHeight = 1024;
  const viewportWidth = 1080;
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--disable-dev-shm-usage", // still useful in production
      // any other non-security flags needed
    ],
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setViewport({ width: viewportWidth, height: viewportHeight });

  return [browser, page];
};

const continueBrowser = async () => {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  return [browser, page];
};

async function getJobUrlList(page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".jobTitle a")).map((el) => {
      return el.href;
    });
  });
}

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
  const [browser, page] = await continueBrowser();

  //mock simulated browser
  // await page.setUserAgent(
  //   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  // );

  let skipCursor = 0;
  let hasNewJobs = true;

  const pageLimit = 20;

  let jobsToScrape = [];

  while (hasNewJobs) {
    if (jobsToScrape.length > pageLimit) {
      break;
    }

    await page.goto(
      `https://uk.indeed.com/jobs?q=software+engineer&start=${skipCursor}`,
      { waitUntil: "domcontentloaded" },
    );
    console.log(`navigating to jobs starting from ${skipCursor}`);

    await sleep(delay);

    await dismissCookieBanner(page);

    await sleep(delay);

    //get the urls we want
    let newUrls = [];
    try {
      newUrls = await getJobUrlList(page);
    } catch (e) {
      console.log(e);
      break;
    }

    console.log(`found ${newUrls.length} links on this page`);

    skipCursor += 10;

    if (newUrls.length === 0) {
      //ending loop here
      // natural end of pagination
      hasNewJobs = false;
    } else {
      jobsToScrape = jobsToScrape.concat(newUrls);
    }

    console.log(jobsToScrape);

    await sleep(delay);
  }

  const corpus = [];

  for (let jobUrl of jobsToScrape) {
    // scrape the job info
    await page.goto(jobUrl);

    await page.title();

    const jobDescription = await getJobDescriptionText(page, jobUrl);

    corpus.push({
      description: jobDescription,
      title: await page.title(),
      url: jobUrl,
    });

    await sleep(delay);
  }

  fs.writeFileSync("./job_corpus.json", JSON.stringify(corpus));

  browser.disconnect();
  console.log("done");
}

run();
