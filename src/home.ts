import './styles/main.css';
import { initShell } from './lib/shell';
import { initHeadlines, initReveals, initVideos } from './lib/motion';
import { initGlobe } from './lib/globe';
import { initRoute } from './lib/route';

initShell();
initRoute();
initGlobe();
initHeadlines();
initReveals();
initVideos();
