'use client';
import { PageWrapper } from '@/components/shell/PageWrapper';
import { USE_MOCKS } from '@/lib/api';
import { btnSecondary, cardCls } from '@/lib/ui-classes';

const TASKS: [string, string[]][] = [
  ['Add a product and put it on the homepage', ['Products → Add product. Fill in name, SKU, category and price. Category and price are required before you can publish.', 'Save Draft, then Publish. Images are uploaded from Media; this form does not have a separate media tab.', 'Placement tab → Add a placement → Homepage: Featured Products. Drag to set the position.']],
  ['Add a spec such as “Spout Reach”', ['Open the product → Specifications tab.', 'Click the “+ Spout Reach” shortcut, or Add your own specification.', 'Fill in the value and save. No developer needed.']],
  ['Rearrange the homepage', ['Pages → Homepage.', 'Drag sections in the left column, or use the ↑ ↓ buttons.', 'Use Hide to take a section off the site without deleting it.', 'Undo and Redo cover your last 20 changes. Publish when happy.']],
  ['Remove a product from one place only', ['Open the product → Placement tab.', 'Click “Remove from here” next to that place. The product and its other places are untouched.']],
];

export function GuideScreen() {
  const reset = () => { try { Object.keys(localStorage).filter((k) => k.startsWith('ft:')).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ } window.location.reload(); };
  return (
    <PageWrapper title="Admin guide">
      <p className="mb-4 text-sm text-grey-700">Short answers to the things you will do most. Nothing here needs technical knowledge.</p>
      <div className="flex flex-col gap-3">
        {TASKS.map(([t, steps]) => (
          <details key={t} className={cardCls}><summary className="min-h-touch cursor-pointer font-medium">{t}</summary>
            <ol className="ml-5 mt-2 list-decimal text-sm">{steps.map((s) => <li key={s}>{s}</li>)}</ol></details>))}
        <section className={cardCls} aria-label="Training mode">
          <h2 className="font-medium">Practice safely</h2>
          <p className="mt-1 text-sm">{USE_MOCKS ? 'This copy runs on practice data. Nothing you do here reaches the live site.' : 'This is the live admin. Changes you publish appear on the real site.'}</p>
          {USE_MOCKS && <button className={`${btnSecondary} mt-3`} onClick={reset}>Reset practice data</button>}
        </section>
      </div>
    </PageWrapper>
  );
}
