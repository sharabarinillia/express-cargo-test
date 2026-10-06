import './styles/main.css';
import { initShell } from './lib/shell';
import { initHeadlines, initReveals, initVideos } from './lib/motion';
import { initGlobe } from './lib/globe';
import { initRoute } from './lib/route';

const lenis = initShell();
initRoute();
initGlobe(lenis);
initHeadlines();
initReveals();
initVideos();
