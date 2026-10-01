import './styles/main.css';
import { gsap } from 'gsap';
import { initShell, reducedMotion } from './lib/shell';
import { initHeadlines } from './lib/motion';

/** Where enquiries go. Set VITE_FORM_ENDPOINT to POST JSON to a form backend; otherwise we fall back to the visitor's email app. */
const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
const SALES = 'salesams@express-cargo.com';

initShell();
initHeadlines();

drawTrace();
initForm();

function drawTrace() {
  const line = document.querySelector<SVGLineElement>('[data-contact-trace]');
  if (!line || reducedMotion) return;
  line.setAttribute('pathLength', '1');
  gsap.fromTo(line, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, delay: 0.4, ease: 'expo.out' });
  gsap.from('[data-fade]', { y: 18, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.35 });
}

function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
  const success = document.querySelector<HTMLElement>('[data-success]');
  const summary = document.querySelector<HTMLElement>('[data-error-summary]');
  const list = document.querySelector<HTMLUListElement>('[data-error-list]');
  const status = document.querySelector<HTMLElement>('[data-form-status]');
  const quoteFields = document.querySelector<HTMLElement>('[data-quote-fields]');
  const unField = document.querySelector<HTMLElement>('[data-un]');
  const messageLabel = document.querySelector<HTMLElement>('[data-message-label]');
  const intro = document.querySelector<HTMLElement>('[data-form-intro]');
  if (!form || !success || !summary || !list || !quoteFields) return;

  const isQuote = () => (form.elements.namedItem('type') as RadioNodeList).value === 'quote';

  const syncType = () => {
    const quote = isQuote();
    quoteFields.hidden = !quote;
    quoteFields.querySelectorAll<HTMLInputElement>('[data-quote-required]').forEach((i) => (i.required = quote));
    if (messageLabel) messageLabel.firstChild!.textContent = quote ? 'Anything else we should know?' : 'Your question';
  };
  const syncDg = () => {
    const yes = (form.elements.namedItem('dg') as RadioNodeList).value === 'Yes';
    unField?.classList.toggle('hidden', !yes);
  };
  form.addEventListener('change', (e) => {
    const name = (e.target as HTMLInputElement).name;
    if (name === 'type') syncType();
    if (name === 'dg') syncDg();
    if ((e.target as HTMLElement).getAttribute('aria-invalid') === 'true') validateField(e.target as HTMLInputElement);
  });

  // prefill from the home page quick quote: /contact/?type=quote&mode=air&from=…&to=…
  const params = new URLSearchParams(location.search);
  const modeMap: Record<string, string> = { air: 'Air freight', road: 'Road', ocean: 'Ocean', 'time-critical': 'Time-critical' };
  const mode = modeMap[params.get('mode') ?? ''];
  if (mode) form.querySelector<HTMLInputElement>(`input[name="mode"][value="${mode}"]`)!.checked = true;
  for (const key of ['from', 'to'] as const) {
    const v = params.get(key);
    if (v) (form.elements.namedItem(key) as HTMLInputElement).value = v;
  }
  if (params.has('type')) {
    requestAnimationFrame(() => document.getElementById('enquiry')?.scrollIntoView({ block: 'start' }));
  }
  syncType();
  syncDg();

  function message(input: HTMLInputElement): string {
    if (input.validity.valueMissing) return input.type === 'checkbox' ? 'Please confirm you agree so we can reply.' : 'This field is required.';
    if (input.validity.typeMismatch) return 'Please enter a valid email address, like name@company.com.';
    return '';
  }
  function labelOf(input: HTMLInputElement): string {
    if (input.type === 'checkbox') return 'Consent';
    const label = form!.querySelector(`label[for="${input.id}"]`);
    if (!label) return input.name;
    // flight-plan field numbers and other decorations are not part of the name
    const clone = label.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.fp-box, [aria-hidden="true"]').forEach((n) => n.remove());
    return (clone.textContent ?? input.name).replace('*', '').trim();
  }
  function validateField(input: HTMLInputElement): boolean {
    const msg = message(input);
    const holder = input.type === 'checkbox' ? input.closest('label')! : input.closest('.field')!;
    holder.querySelector('.error')?.remove();
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      const err = document.createElement('p');
      err.className = 'error';
      err.id = `${input.id || input.name}-error`;
      err.textContent = msg;
      holder.appendChild(err);
      input.setAttribute('aria-describedby', err.id);
      return false;
    }
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [...form.querySelectorAll<HTMLInputElement>('input[required], textarea[required]')].filter(
      (i) => !i.closest('[hidden]'),
    );
    const invalid = fields.filter((f) => !validateField(f));
    list.replaceChildren();
    if (invalid.length) {
      invalid.forEach((f) => {
        const li = document.createElement('li');
        li.innerHTML = `<a class="link-u" href="#${f.id || ''}">${labelOf(f)}</a>`;
        li.querySelector('a')!.addEventListener('click', (ev) => {
          ev.preventDefault();
          f.focus();
        });
        list.appendChild(li);
      });
      summary.classList.remove('hidden');
      summary.focus();
      return;
    }
    summary.classList.add('hidden');

    const data = new FormData(form);
    if (data.get('website')) return; // honeypot
    const entries = [...data.entries()].filter(([k, v]) => k !== 'website' && k !== 'consent' && String(v).trim() !== '');
    if (!isQuote()) {
      const skip = new Set(['mode', 'from', 'to', 'pieces', 'weight', 'dimensions', 'commodity', 'temperature', 'ready', 'dg', 'un']);
      entries.splice(0, entries.length, ...entries.filter(([k]) => !skip.has(k)));
    }

    if (ENDPOINT) {
      if (status) status.textContent = 'Sending…';
      try {
        const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(entries)) });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        if (status) status.textContent = '';
        summary.classList.remove('hidden');
        list.innerHTML = `<li>We couldn't send your enquiry. Please email <a class="link-u" href="mailto:${SALES}">${SALES}</a> or call +31 20 333 2405.</li>`;
        summary.focus();
        return;
      }
    } else {
      const subject = isQuote()
        ? `Quote request: ${data.get('from')} → ${data.get('to')} (${data.get('mode')})`
        : `Question from ${data.get('name')}`;
      const body = entries.map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v}`).join('\n');
      const href = `mailto:${SALES}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      // the draft stays on screen: a missing mail app must not lose the enquiry
      const draft = document.querySelector<HTMLTextAreaElement>('[data-draft]');
      if (draft) draft.value = `To: ${SALES}\nSubject: ${subject}\n\n${body}`;
      document.querySelector<HTMLAnchorElement>('[data-mailto]')?.setAttribute('href', href);
      window.location.href = href;
    }

    form.classList.add('hidden');
    intro?.classList.add('hidden');
    success.classList.remove('hidden');
    if (ENDPOINT) {
      success.querySelector('[data-success-title]')!.textContent = 'Thank you. Your enquiry is on its way.';
      success.querySelector('[data-success-copy]')!.textContent = 'Your coordinator will get back to you. For anything urgent, call +31 20 333 2405.';
      success.querySelector<HTMLElement>('[data-success-draft]')?.classList.add('hidden');
    }
    success.focus();
  });

  document.querySelector('[data-copy]')?.addEventListener('click', async () => {
    const draft = document.querySelector<HTMLTextAreaElement>('[data-draft]');
    const out = document.querySelector<HTMLElement>('[data-copy-status]');
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.value);
      if (out) out.textContent = 'Copied. Paste it into a new email.';
    } catch {
      draft.focus();
      draft.select();
      if (out) out.textContent = 'Selected. Press Ctrl+C (or Cmd+C) to copy.';
    }
  });

  // back to the form with everything still filled in
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    success.classList.add('hidden');
    intro?.classList.remove('hidden');
    form.classList.remove('hidden');
    form.querySelector<HTMLInputElement>('input')?.focus();
  });
}
