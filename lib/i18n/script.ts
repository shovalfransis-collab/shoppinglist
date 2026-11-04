import { DEFAULT_LOCALE, LOCALES, RTL_LOCALES } from "./types";

export const LANG_STORAGE_KEY = "shoppinglist:lang";

// Tiny script inlined in <head> so lang/dir are right before the first paint (no flash).
// Saved choice wins; otherwise Hebrew if the browser language starts with "he", else English.
export const INIT_SCRIPT = `(function(){
var locales=${JSON.stringify(LOCALES)},rtl=${JSON.stringify(RTL_LOCALES)},l=null;
try{l=localStorage.getItem(${JSON.stringify(LANG_STORAGE_KEY)})}catch(e){}
if(locales.indexOf(l)<0){l=((navigator.language||"").toLowerCase().indexOf("he")===0)?"he":${JSON.stringify(DEFAULT_LOCALE)}}
var d=document.documentElement;d.lang=l;d.dir=rtl.indexOf(l)>=0?"rtl":"ltr";
})();`;
