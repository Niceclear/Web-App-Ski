import chromium from "@sparticuz/chromium";
import { chromium as pwChromium } from "playwright-core";

async function scrapePage() {
  const browser = await pwChromium.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    
        const targetUrl = "https://valmeinier.digisnow.app/forecast/winter/true/fr";
    
        console.log(`Navigation vers ${targetUrl}...`);
        await page.goto(targetUrl, { waitUntil: "networkidle" });
    
        console.log("Attente du chargement des données...");
    
        await page.waitForTimeout(500);

        const widgetData = await page.evaluate(() => {
          const widget = document.querySelector('widget-digisnow-snow');
          if (!widget) return { found: false };
          const shadowRoot = widget.shadowRoot;
          if (shadowRoot) {
            const cumulTop = shadowRoot.querySelector('.cumulTop');
            const cumulBottom = shadowRoot.querySelector('.cumulBottom');
            return {
              cumulTopText: cumulTop?.textContent?.trim() || null,
              cumulBottomText: cumulBottom?.textContent?.trim() || null,
            };
          }
          return {
            widgetHTML: widget.innerHTML?.substring(0, 3000),
            outerHTML: widget.outerHTML?.substring(0, 3000),
          };
        });

        console.log("Widget data:", JSON.stringify(widgetData, null, 2));
      } catch (error) {
        console.error("Erreur lors du scraping:", error);
        throw error;
      } finally {
        await browser.close();
      }
    }
    
scrapePage()
  .then((html) => {
    console.log("\n✓ Scraping terminé!");
  })
  .catch((error) => {
    console.error("\n✗ Échec du scraping:", error);
    process.exit(1);
  });