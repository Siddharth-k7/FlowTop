import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AXE_PATH = path.resolve(__dirname, '../../node_modules/axe-core/axe.min.js');
const axeSource = fs.readFileSync(AXE_PATH, 'utf-8');

const PAGES_TO_TEST = [
  { name: 'Homepage', url: 'http://localhost:3000/' },
  { name: 'Products Catalogue', url: 'http://localhost:3000/products' },
  { name: 'Category Listing', url: 'http://localhost:3000/category/basin-mixers' },
  { name: 'Product Detail', url: 'http://localhost:3000/products/aura-tall-basin-mixer' },
  { name: 'Collections Index', url: 'http://localhost:3000/collections' },
  { name: 'Collection Detail', url: 'http://localhost:3000/collections/aura' },
  { name: 'Cart Page', url: 'http://localhost:3000/cart' },
  { name: 'Checkout Page', url: 'http://localhost:3000/checkout' },
  { name: 'Contact Page', url: 'http://localhost:3000/contact' },
  { name: 'Dealer Network Page', url: 'http://localhost:3000/contact?type=dealer' },
  { name: 'Journal Index', url: 'http://localhost:3000/journal' },
  { name: 'Journal Article Detail', url: 'http://localhost:3000/journal/how-to-choose-a-basin-mixer' },
];

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWsUrl(port = 9224) {
  for (let i = 0; i < 35; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const list = await res.json();
      const page = list.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // wait
    }
    await wait(200);
  }
  throw new Error('Chrome remote debugging not available on port ' + port);
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await wait(1800);
    for (let i = 0; i < 20; i++) {
      const isReady = await this.evaluate('document.readyState === "complete" && !!document.getElementById("main")');
      if (isReady) break;
      await wait(200);
    }
    await wait(600);
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('─── Flowtop WCAG 2.2 AA Automated Accessibility Audit ───\n');
  console.log(`Loaded axe-core from: ${AXE_PATH}`);

  const userDataDir = path.resolve('/tmp', 'ft-axe-' + Date.now());
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ]);

  const auditResults = [];

  try {
    const wsUrl = await getWsUrl(9224);
    const client = new CDPClient(wsUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });

    for (const page of PAGES_TO_TEST) {
      process.stdout.write(`Auditing [${page.name}] (${page.url})... `);
      await client.navigate(page.url);

      // 1. Inject axe-core
      await client.evaluate(axeSource);

      // 2. Run axe audit configured with WCAG 2.2 AA rules
      const axeResult = await client.evaluate(`
        (async () => {
          if (typeof axe === 'undefined') return { error: 'axe not loaded' };
          const results = await axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
            }
          });
          return {
            violations: results.violations.map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              help: v.help,
              helpUrl: v.helpUrl,
              nodesCount: v.nodes.length,
              sampleTarget: v.nodes[0] ? v.nodes[0].target : null,
              sampleFailure: v.nodes[0] ? v.nodes[0].failureSummary : null,
            })),
            passesCount: results.passes.length,
            incompleteCount: results.incomplete.length,
          };
        })()
      `);

      // 3. Custom structural checks: H1 count, heading skips, skip link target
      const structuralAudit = await client.evaluate(`
        (() => {
          // H1 check
          const h1s = Array.from(document.querySelectorAll('h1'));
          const h1Texts = h1s.map(h => h.textContent.trim());

          // Heading hierarchy check
          const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .map(h => parseInt(h.tagName.substring(1), 10));
          const skippedLevels = [];
          for (let i = 1; i < allHeadings.length; i++) {
            const prev = allHeadings[i - 1];
            const curr = allHeadings[i];
            if (curr > prev + 1) {
              skippedLevels.push({ prev, curr, index: i });
            }
          }

          // Skip link check
          const skipLink = document.querySelector('a[href="#main"]');
          const mainTarget = document.getElementById('main');
          const hasSkipLink = Boolean(skipLink && mainTarget);

          // Image alt check
          const images = Array.from(document.querySelectorAll('img'));
          const missingAltCount = images.filter(img => !img.hasAttribute('alt')).length;

          // Focus traps or tabindex > 0
          const positiveTabindex = Array.from(document.querySelectorAll('[tabindex]'))
            .filter(el => parseInt(el.getAttribute('tabindex'), 10) > 0).length;

          return {
            h1Count: h1s.length,
            h1Texts,
            skippedLevels,
            hasSkipLink,
            totalImages: images.length,
            missingAltCount,
            positiveTabindex,
          };
        })()
      `);

      const violations = axeResult?.violations || [];
      const isClean = violations.length === 0 && structuralAudit?.h1Count === 1 && structuralAudit?.skippedLevels.length === 0;

      if (isClean) {
        console.log(`✅ PASS (${axeResult?.passesCount || 0} checks passed, 0 violations)`);
      } else {
        console.log(`⚠️ ISSUES DETECTED: ${violations.length} axe violations, h1Count=${structuralAudit?.h1Count}, skippedHeadings=${structuralAudit?.skippedLevels.length}`);
      }

      auditResults.push({
        page: page.name,
        url: page.url,
        axePasses: axeResult?.passesCount,
        violations,
        structural: structuralAudit,
      });
    }

    client.close();
  } finally {
    chrome.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  // Summary Report
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                 AXE ACCESSIBILITY SUMMARY                     ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalViolations = 0;
  for (const r of auditResults) {
    console.log(`• ${r.page}:`);
    console.log(`  - <h1> Count: ${r.structural?.h1Count} (Heading: "${r.structural?.h1Texts?.join('", "')}")`);
    console.log(`  - Heading Hierarchy: ${r.structural?.skippedLevels.length === 0 ? 'Strict sequence (no skipped levels)' : JSON.stringify(r.structural?.skippedLevels)}`);
    console.log(`  - Skip Link to #main: ${r.structural?.hasSkipLink ? 'Present & linked' : 'Missing'}`);
    console.log(`  - Images missing alt: ${r.structural?.missingAltCount} of ${r.structural?.totalImages}`);
    console.log(`  - Positive tabindex: ${r.structural?.positiveTabindex} (0 is required)`);
    console.log(`  - Axe Rules Passed: ${r.axePasses}`);
    console.log(`  - Axe Violations: ${r.violations.length}`);

    if (r.violations.length > 0) {
      totalViolations += r.violations.length;
      for (const v of r.violations) {
        console.log(`    ❌ [${v.impact?.toUpperCase()}] ${v.id}: ${v.help}`);
        console.log(`       Target: ${JSON.stringify(v.sampleTarget)}`);
        console.log(`       Summary: ${v.sampleFailure?.split('\n')[0]}`);
      }
    }
    console.log('');
  }

  console.log(`Total Remaining Axe Violations Across All Page Types: ${totalViolations}`);
  if (totalViolations > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
