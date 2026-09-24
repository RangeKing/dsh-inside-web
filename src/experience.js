import * as casePaths from './case-paths.js';
import { refreshGallery } from './gallery.js';
import { CaseRenderer } from './world.js';
import { HomeExperience } from './home.js';
import { renderCompany, showTimer } from './company.js';

window.DSHRenderer=CaseRenderer;
window.DSHCasePaths=casePaths;
const home=new HomeExperience();
window.DSHExperience={setMode:mode=>{home.show(mode==='home');refreshGallery(mode);},home,renderCompany,showTimer};
