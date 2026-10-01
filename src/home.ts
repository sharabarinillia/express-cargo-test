import './styles/main.css';
import { initShell } from './lib/shell';
import { initTrace } from './lib/trace';
import { initColdChain, initHeadlines, initJourneys, initLogger, initPrintout, initReveals, initTimeCritical } from './lib/motion';

initShell();
// pins first, so the trace measures chapters with their pin spacers
initTimeCritical();
let setTemp: (t: number) => void = () => {};
const trace = initTrace((t) => setTemp(t));
setTemp = initLogger(trace);
initHeadlines();
initReveals();
initColdChain();
initJourneys();
initPrintout(trace);
