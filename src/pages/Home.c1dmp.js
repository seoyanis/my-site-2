import wixWindowFrontend from 'wix-window-frontend';
import wixData from 'wix-data';
import { initHome } from 'public/cosmic/home.js';

$w.onReady(() => initHome($w, { wixWindowFrontend, wixData }));
