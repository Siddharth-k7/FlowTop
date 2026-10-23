// Server-renders components and checks that every ARIA id reference resolves.
// The components are compiled with the TypeScript compiler the package already
// depends on, so this test needs no bundler and no DOM.
import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, '..');
const srcDir = path.join(uiRoot, 'src');
const outDir = path.join(uiRoot, 'node_modules', '.cache', 'aria-test');

function compileTree(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const from = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      compileTree(from, path.join(out, entry.name));
    } else if (/\.tsx?$/.test(entry.name)) {
      const { outputText } = ts.transpileModule(fs.readFileSync(from, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
        fileName: from,
      });
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, entry.name.replace(/\.tsx?$/, '.js')), outputText);
    }
  }
}

let ui;
let React;
let render;

/** Every id="..." in the markup. */
function ids(html) {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
}

/** Every [attr, id] pair from aria-controls, aria-describedby and aria-labelledby. */
function refs(html) {
  const out = [];
  for (const m of html.matchAll(/\s(aria-(?:controls|describedby|labelledby))="([^"]+)"/g)) {
    for (const id of m[2].split(/\s+/).filter(Boolean)) out.push([m[1], id]);
  }
  return out;
}

function assertAllRefsResolve(html, label) {
  const known = ids(html);
  const dangling = refs(html).filter(([, id]) => !known.has(id));
  assert.deepStrictEqual(dangling, [], `${label}: dangling ARIA references`);
}

describe('ARIA references resolve in server-rendered markup', () => {
  before(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
    compileTree(srcDir, outDir);
    ui = require(path.join(outDir, 'index.js'));
    React = require('react');
    render = require('react-dom/server').renderToStaticMarkup;
  });

  it('Tabs (items): every tab, including inactive and disabled ones, points at a panel in the DOM', () => {
    const html = render(
      React.createElement(ui.Tabs, {
        'aria-label': 'Specs',
        items: [
          { id: 'a', label: 'A', content: 'Panel A' },
          { id: 'b', label: 'B', content: 'Panel B' },
          { id: 'c', label: 'C', content: 'Panel C', disabled: true },
        ],
      })
    );
    assertAllRefsResolve(html, 'Tabs items');
    assert.strictEqual((html.match(/aria-controls="/g) || []).length, 3, 'one aria-controls per tab');
    assert.strictEqual((html.match(/role="tabpanel"/g) || []).length, 3, 'one panel element per tab');
    assert.strictEqual((html.match(/role="tabpanel"[^>]*hidden=""/g) || []).length, 2, 'inactive panels are hidden');
    assert.ok(!html.includes('Panel B'), 'inactive panel content is not mounted');
    assert.match(html, /<button[^>]*disabled=""[^>]*>C<\/button>/, 'disabled tab renders disabled');
  });

  it('Tabs (composed): a TabList with no TabPanels sets no aria-controls', () => {
    const html = render(
      React.createElement(
        ui.Tabs,
        { defaultValue: 'a' },
        React.createElement(
          ui.TabList,
          { 'aria-label': 'Filters' },
          React.createElement(ui.Tab, { value: 'a' }, 'A'),
          React.createElement(ui.Tab, { value: 'b' }, 'B')
        )
      )
    );
    assertAllRefsResolve(html, 'Tabs composed');
    assert.ok(!html.includes('aria-controls'), 'no panel, no aria-controls');
  });

  it('Menu: a closed menu trigger does not point at the unrendered menu', () => {
    const html = render(
      React.createElement(
        ui.Menu,
        { trigger: React.createElement('button', { type: 'button' }, 'Options') },
        React.createElement(ui.MenuItem, null, 'Edit')
      )
    );
    assertAllRefsResolve(html, 'Menu closed');
  });

  it('Field: aria-describedby resolves with a hint, with an error, and with both', () => {
    const child = p => React.createElement('input', { id: p.id, 'aria-describedby': p['aria-describedby'] });
    for (const props of [{ hint: 'Hint' }, { error: 'Error' }, { hint: 'Hint', error: 'Error' }]) {
      const html = render(React.createElement(ui.Field, { label: 'Name', ...props }, child));
      assertAllRefsResolve(html, `Field ${JSON.stringify(props)}`);
    }
    for (const C of [ui.Input, ui.Select, ui.Textarea, ui.Checkbox, ui.Switch, ui.Radio]) {
      const extra = C === ui.Select ? { options: [{ label: 'One', value: '1' }] } : C === ui.Radio ? { value: 'r' } : {};
      for (const props of [{ hint: 'Hint' }, { hint: 'Hint', error: 'Error' }, { label: undefined, hint: 'Hint' }]) {
        const html = render(React.createElement(C, { label: 'Name', ...extra, ...props }));
        assertAllRefsResolve(html, `${C.displayName || C.name} ${JSON.stringify(props)}`);
      }
    }
    for (const props of [{ hint: 'Hint' }, { hint: 'Hint', error: 'Error' }]) {
      const html = render(
        React.createElement(ui.RadioGroup, { label: 'Tone', ...props }, React.createElement(ui.Radio, { value: 'a', label: 'A' }))
      );
      assertAllRefsResolve(html, `RadioGroup ${JSON.stringify(props)}`);
    }
  });

  it('Toast: both live regions are in the markup before the first toast', () => {
    const html = render(React.createElement(ui.ToastProvider, null, 'app'));
    assert.match(html, /role="status"[^>]*aria-live="polite"/);
    assert.match(html, /role="alert"[^>]*aria-live="assertive"/);
  });

  it('Table: clickable rows are keyboard reachable through a button', () => {
    const html = render(
      React.createElement(ui.Table, {
        columns: [{ id: 'name', header: 'Name' }],
        data: [{ name: 'One' }, { name: 'Two' }],
        rowKey: r => r.name,
        onRowClick: () => {},
      })
    );
    const rows = html.split('<tbody')[1].split('</tbody>')[0].split('<tr').slice(1);
    assert.strictEqual(rows.length, 2);
    for (const row of rows) assert.match(row, /<button type="button"/, 'each clickable row has a button');
  });

  it('Table: a loading table is aria-busy and renders skeleton rows; an idle one is not busy', () => {
    const base = { columns: [{ id: 'name', header: 'Name' }], data: [{ name: 'One' }], rowKey: r => r.name };
    const busy = render(React.createElement(ui.Table, { ...base, loading: true, skeletonRowCount: 3 }));
    assert.match(busy, /<table[^>]*aria-busy="true"/);
    assert.strictEqual((busy.match(/<tr class="animate-pulse"/g) || []).length, 3);
    const idle = render(React.createElement(ui.Table, base));
    assert.ok(!/<table[^>]*aria-busy/.test(idle));
  });

  it('Switch: the hit area is the 44px touch-target button, not the 24px track', () => {
    const html = render(React.createElement(ui.Switch, { label: 'Live' }));
    assert.match(html, /<button[^>]*role="switch"[^>]*class="[^"]*\btouch-target\b/);
  });
});
