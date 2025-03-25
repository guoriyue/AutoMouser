// This file can use ES modules
import { initGoogleHandler } from './google_handler.js';

console.log("Google module loaded");
const googleHandler = initGoogleHandler();
window.googleHandler = googleHandler; 