import './styles/main.css';
import { gsap } from 'gsap';
import { initShell, reducedMotion } from './lib/shell';
import { initHeadlines } from './lib/motion';
import { t } from './lib/i18n';

/** Where enquiries go. Set VITE_FORM_ENDPOINT to POST JSON to a form backend; otherwise we fall back to the visitor's email app. */
const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;
const SALES = 'salesams@express-cargo.nl';

initShell();
initHeadlines();
if (!reducedMotion) gsap.from('[data-fade]', { y: 18, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.35 });
initForm();

function initForm() {
  const form = document.querySelector<HTMLFormElement>('[data-enquiry]');
  const success = document.querySelector<HTMLElement>('[data-success]');
  const summary = document.querySelector<HTMLElement>('[data-error-summary]');
  const list = document.querySelector<HTMLUListElement>('[data-error-list]');
  const status = document.querySelector<HTMLElement>('[data-form-status]');
  const line = document.querySelector<HTMLElement>('[data-flightline]');
  const dest = document.querySelector<HTMLElement>('[data-fl-dest]');
  if (!form || !success || !summary || !list) return;

  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | null;
  const value = (name: string) => (field(name)?.value ?? '').trim();

  // the flight line fills as the sentence is completed; the destination tag follows "to"
  const KEY = ['what', 'from', 'to', 'name', 'email'];
  const syncLine = () => {
    const done = KEY.filter((k) => value(k)).length;
    line?.style.setProperty('--fl', `${(done / KEY.length) * 100}%`);
    line?.style.setProperty('--flk', String(done / KEY.length));
    const to = value('to');
    if (dest) dest.textContent = to || t('Your destination', 'Uw bestemming');
    dest?.parentElement?.classList.toggle('is-set', !!to);
  };
  form.addEventListener('input', (e) => {
    syncLine();
    const t = e.target as HTMLInputElement;
    if (t.getAttribute('aria-invalid') === 'true') validate(t);
    if (!form.querySelector('[aria-invalid="true"]')) summary.classList.add('hidden');
  });
  form.addEventListener('change', syncLine);

  // prefill from the home page quick quote: /contact/?type=quote&mode=air&from=…&to=…
  const params = new URLSearchParams(location.search);
  const modeMap: Record<string, string> = { air: 'Air freight', road: 'Road', ocean: 'Ocean', 'time-critical': 'Time-critical' }; // option values, the same in both languages
  const mode = modeMap[params.get('mode') ?? ''];
  if (mode && field('mode')) field('mode')!.value = mode;
  for (const key of ['from', 'to', 'what', 'weight', 'un'] as const) {
    const v = params.get(key)?.slice(0, 200);
    if (v && field(key)) field(key)!.value = v;
  }
  // optional details: each chip reveals its field (and focuses it); a field
  // that already holds a value, such as a weight from the tools, starts open
  const chips = [...form.querySelectorAll<HTMLButtonElement>('[data-extras] .chip')];
  const show = (chip: HTMLButtonElement, open: boolean, focus = false) => {
    const box = document.getElementById(chip.getAttribute('aria-controls')!);
    if (!box) return;
    box.hidden = !open;
    chip.setAttribute('aria-expanded', String(open));
    if (focus && open) box.querySelector<HTMLElement>('input, select')?.focus();
  };
  chips.forEach((chip) => {
    chip.addEventListener('click', () => show(chip, chip.getAttribute('aria-expanded') !== 'true', true));
    const box = document.getElementById(chip.getAttribute('aria-controls')!);
    if (box?.querySelector<HTMLInputElement>('input, select')?.value) show(chip, true);
  });
  syncLine();

  const LABELS: Record<string, string> = { name: t('Your name', 'Uw naam'), email: t('Your email', 'Uw e-mailadres') };
  function message(input: HTMLInputElement): string {
    if (input.validity.valueMissing) return input.name === 'email' ? t('add an email so we can reply.', 'vul een e-mailadres in, zodat we kunnen antwoorden.') : t('add your name.', 'vul uw naam in.');
    if (input.validity.typeMismatch) return t('check the address, like name@company.com.', 'controleer het adres, bijvoorbeeld naam@bedrijf.nl.');
    return '';
  }
  function validate(input: HTMLInputElement): boolean {
    const msg = message(input);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-description', msg);
      return false;
    }
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-description');
    return true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const required = [...form.querySelectorAll<HTMLInputElement>('input[required]')];
    const invalid = required.filter((f) => !validate(f));
    list.replaceChildren();
    if (invalid.length) {
      invalid.forEach((f) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'link-u';
        a.href = `#${f.id}`;
        a.textContent = `${LABELS[f.name] ?? f.name}: ${message(f)}`;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          f.focus();
        });
        li.appendChild(a);
        list.appendChild(li);
      });
      summary.classList.remove('hidden');
      summary.focus();
      return;
    }
    summary.classList.add('hidden');

    const data = new FormData(form);
    if (data.get('website')) return; // honeypot
    const entries = [...data.entries()].filter(([k, v]) => k !== 'website' && String(v).trim() !== '');

    if (ENDPOINT) {
      if (status) status.textContent = t('Sending…', 'Versturen…');
      try {
        const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.fromEntries(entries)) });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        if (status) status.textContent = '';
        summary.classList.remove('hidden');
        list.innerHTML = `<li>${t("We couldn't send your enquiry. Please email", 'We konden uw aanvraag niet versturen. Mail naar')} <a class="link-u" href="mailto:${SALES}">${SALES}</a> ${t('or call', 'of bel')} +31 20 333 2405.</li>`;
        summary.focus();
        return;
      }
    } else {
      const route = value('from') || value('to') ? ` ${value('from') || '?'} → ${value('to') || '?'}` : '';
      const subject = `${t('Enquiry', 'Aanvraag')}: ${value('what') || t('shipment', 'zending')}${route}${value('mode') ? ` (${value('mode')})` : ''}`;
      const body = entries.map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v}`).join('\n');
      const href = `mailto:${SALES}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      // the draft stays on screen: a missing mail app must not lose the enquiry
      const draft = document.querySelector<HTMLTextAreaElement>('[data-draft]');
      if (draft) draft.value = `To: ${SALES}\nSubject: ${subject}\n\n${body}`;
      document.querySelector<HTMLAnchorElement>('[data-mailto]')?.setAttribute('href', href);
      window.location.href = href;
    }

    form.classList.add('hidden');
    success.classList.remove('hidden');
    line?.style.setProperty('--fl', '100%');
    line?.style.setProperty('--flk', '1');
    if (ENDPOINT) {
      success.querySelector('[data-success-title]')!.textContent = t('Thank you. Your enquiry is on its way.', 'Dank u. Uw aanvraag is onderweg.');
      success.querySelector('[data-success-copy]')!.textContent = t('A coordinator will get back to you. For anything urgent, call +31 20 333 2405.', 'Een coördinator neemt contact met u op. Is het dringend? Bel +31 20 333 2405.');
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
      if (out) out.textContent = t('Copied. Paste it into a new email.', 'Gekopieerd. Plak het in een nieuwe e-mail.');
    } catch {
      draft.focus();
      draft.select();
      if (out) out.textContent = t('Selected. Press Ctrl+C (or Cmd+C) to copy.', 'Geselecteerd. Druk op Ctrl+C (of Cmd+C) om te kopiëren.');
    }
  });

  // back to the sentence with everything still filled in
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    success.classList.add('hidden');
    form.classList.remove('hidden');
    syncLine();
    field('what')?.focus();
  });
}
