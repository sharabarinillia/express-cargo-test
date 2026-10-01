import './styles/main.css';
import { initShell } from './lib/shell';
import { initHeadlines, initProjects, initReveals, initVideos } from './lib/motion';
import { initRoute } from './lib/route';

initShell();
// pins first, so the route measures chapters with their pin spacers
initProjects();
initRoute();
initHeadlines();
initReveals();
initVideos();
