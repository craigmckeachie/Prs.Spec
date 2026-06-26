import { chromium } from "playwright";
import path from "path";

const BASE = "http://localhost:5173";
const OUT = "C:\\Users\\craig\\Documents\\git\\Prs\\Prs.Spec\\screenshots";
const CREDS = { username: "elinor_steuber42", password: "test1234" };

async function shot(page, filename) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: path.join(OUT, filename), fullPage: false });
  console.log(`  saved ${filename}`);
}

async function login(page) {
  await page.goto(`${BASE}/signin`);
  await page.waitForLoadState("networkidle");
  await page.fill("#username", CREDS.username);
  await page.fill("#password", CREDS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/requests`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Sign In
  console.log("Sign In...");
  await page.goto(`${BASE}/signin`);
  await page.waitForLoadState("networkidle");
  await shot(page, "signin.png");

  // Log in for the rest
  await page.locator("#username").pressSequentially(CREDS.username, { delay: 30 });
  await page.locator("#password").pressSequentially(CREDS.password, { delay: 30 });
  await page.click("button.btn-primary");
  await page.waitForURL(`${BASE}/requests`);

  // Fetch IDs from API for use in subsequent pages
  const API = "http://localhost:5555/api";
  const ids = await page.evaluate(async ({ api }) => {
    const [requests, products, vendors, users] = await Promise.all([
      fetch(`${api}/requests`).then(r => r.json()),
      fetch(`${api}/products`).then(r => r.json()),
      fetch(`${api}/vendors`).then(r => r.json()),
      fetch(`${api}/users`).then(r => r.json()),
    ]);
    const requestId = requests[0]?.id ?? null;
    // GET /api/requests/{id} includes requestLines; list endpoint does not
    let lineId = null;
    if (requestId) {
      const fullRequest = await fetch(`${api}/requests/${requestId}`).then(r => r.json());
      lineId = fullRequest?.requestLines?.[0]?.id ?? null;
      // if first request has no lines, try a few more
      if (!lineId) {
        for (const req of requests.slice(1, 10)) {
          const fr = await fetch(`${api}/requests/${req.id}`).then(r => r.json());
          if (fr?.requestLines?.length > 0) {
            lineId = fr.requestLines[0].id;
            break;
          }
        }
      }
    }
    return {
      requestId,
      lineId,
      productId: products[0]?.id ?? null,
      vendorId: vendors[0]?.id ?? null,
      userId: users[0]?.id ?? null,
    };
  }, { api: API });
  console.log("  IDs:", JSON.stringify(ids));

  // Requests List
  console.log("Requests List...");
  await shot(page, "requests.png");

  // Request Create
  console.log("Request Create...");
  await page.goto(`${BASE}/requests/create`);
  await page.waitForLoadState("networkidle");
  await shot(page, "requests-create.png");

  // Request Edit
  console.log("Request Edit...");
  await page.goto(`${BASE}/requests/edit/${ids.requestId}`);
  await page.waitForLoadState("networkidle");
  await shot(page, "requests-edit.png");

  // Request Detail
  console.log("Request Detail...");
  await page.goto(`${BASE}/requests/detail/${ids.requestId}`);
  await page.waitForLoadState("networkidle");
  await shot(page, "requests-detail.png");

  // Line Item Create
  console.log("Line Item Create...");
  await page.goto(`${BASE}/requests/detail/${ids.requestId}/requestline/create`);
  await page.waitForLoadState("networkidle");
  await shot(page, "requests-detail-requestline-create.png");

  const lineId = ids.lineId;
  console.log(`  line id: ${lineId}`);

  if (lineId) {
    console.log("Line Item Edit...");
    await page.goto(`${BASE}/requests/detail/${ids.requestId}/requestline/edit/${lineId}`);
    await page.waitForLoadState("networkidle");
    await shot(page, "requests-detail-requestline-edit.png");
  } else {
    console.log("  no line items, skipping line item edit");
  }

  // Products List
  console.log("Products List...");
  await page.goto(`${BASE}/products`);
  await page.waitForLoadState("networkidle");
  await shot(page, "products.png");

  // Product Create
  console.log("Product Create...");
  await page.goto(`${BASE}/products/create`);
  await page.waitForLoadState("networkidle");
  await shot(page, "products-create.png");

  // Product Edit
  console.log("Product Edit...");
  await page.goto(`${BASE}/products/edit/${ids.productId}`);
  await page.waitForLoadState("networkidle");
  await shot(page, "products-edit.png");

  // Vendors List
  console.log("Vendors List...");
  await page.goto(`${BASE}/vendors`);
  await page.waitForLoadState("networkidle");
  await shot(page, "vendors.png");

  // Vendor Create
  console.log("Vendor Create...");
  await page.goto(`${BASE}/vendors/create`);
  await page.waitForLoadState("networkidle");
  await shot(page, "vendors-create.png");

  // Vendor Edit
  console.log("Vendor Edit...");
  await page.goto(`${BASE}/vendors/edit/${ids.vendorId}`);
  await page.waitForLoadState("networkidle");
  await shot(page, "vendors-edit.png");

  // Users List
  console.log("Users List...");
  await page.goto(`${BASE}/users`);
  await page.waitForLoadState("networkidle");
  await shot(page, "users.png");

  // User Create
  console.log("User Create...");
  await page.goto(`${BASE}/users/create`);
  await page.waitForLoadState("networkidle");
  await shot(page, "users-create.png");

  // User Edit
  console.log("User Edit...");
  await page.goto(`${BASE}/users/edit/${ids.userId}`);
  await page.waitForLoadState("networkidle");
  await shot(page, "users-edit.png");

  await browser.close();
  console.log("\nAll screenshots saved.");
})();
