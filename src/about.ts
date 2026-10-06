import './styles/main.css';
import './styles/pages.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initShell, reducedMotion } from './lib/shell';
import { initHeadlines } from './lib/motion';
import { countTo, initPageMotion } from './lib/page';

gsap.registerPlugin(ScrollTrigger);

initShell();
initHeadlines();
initPageMotion();

// years at Schiphol, counted from the founding year
const years = document.querySelector<HTMLElement>('[data-count-years]');
const since = new Date().getFullYear() - 2002;
if (years) years.textContent = String(since);
const figures = document.querySelector<HTMLElement>('[data-figures]');
if (figures && years && !reducedMotion) {
  years.dataset.n = '0';
  years.textContent = '0';
  ScrollTrigger.create({ trigger: figures, start: 'top 85%', once: true, onEnter: () => countTo(years, since, (n) => String(Math.round(n)), 1.6) });
  gsap.from(figures.children, { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: figures, start: 'top 85%', once: true } });
}
