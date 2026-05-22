const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  console.log("Navigating to http://localhost:8081...");
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle2' });
  
  const title = await page.title();
  console.log("Page Title:", title);

  const content = await page.evaluate(() => document.getElementById('root')?.innerHTML || document.body.innerHTML);
  console.log("Page Content snippet (first 500 chars):", content.substring(0, 500));

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
