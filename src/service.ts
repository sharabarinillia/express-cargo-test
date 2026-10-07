import './styles/main.css';
import './styles/pages.css';
import { initShell } from './lib/shell';
import { initHeadlines, initVideos } from './lib/motion';
import { initPageMotion } from './lib/page';
import { initJourney } from './lib/journey';

initShell();
initHeadlines();
initVideos();
initPageMotion();
initJourney();
