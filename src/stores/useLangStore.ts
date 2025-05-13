// store.js
import { defineStore } from 'pinia';

export const useLangStore = defineStore('lang', {
  state: () => ({
    lang: localStorage.getItem('lang') || 'en',
  }),
  actions: {
    setLang(newLang: string) {
      this.lang = newLang;
      localStorage.setItem('lang', newLang);
    },
  },
});
