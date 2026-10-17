import wixWindowFrontend from 'wix-window-frontend';
import { initMaster } from 'public/cosmic/master.js';

$w.onReady(() => initMaster($w, { wixWindowFrontend }));
