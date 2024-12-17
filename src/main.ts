// import { createApolloProvider } from '@vue/apollo-option';
import '@oraichain/oraiscan-widget';
import App from '@/App.vue';
import i18n from '@/plugins/i18n';
import '@/style.css';
import { createApp, h, provide, ref } from 'vue';
import { createPinia } from 'pinia';
import LazyLoad from 'lazy-load-vue3';
import VueAwesomePaginate from 'vue-awesome-paginate';
import 'vue-awesome-paginate/dist/style.css';
import router from './router';
import { useBaseStore } from './stores/useBaseStore';
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core';
import { DefaultApolloClient } from '@vue/apollo-composable';
import * as Sentry from "@sentry/vue";

// apollo
const cache = new InMemoryCache();
const sentryDns = import.meta.env.VITE_SENTRY_DNS;

const httpLink = createHttpLink({
  uri: 'https://indexer.scanium.io/',
})

const apolloClient = new ApolloClient({
  cache,
  link: httpLink,
});

// const apolloProvider = createApolloProvider({
//   defaultClient: apolloClient,
// });

// Create vue app
const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient);
  },
  render: () => h(App),
});

// Sentry config
Sentry.init({
  app,
  dsn: sentryDns,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [/^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

// Use plugins
app.use(i18n);
app.use(createPinia());
app.use(router);
app.use(LazyLoad, { component: true });
app.use(VueAwesomePaginate as any);
// app.use(apolloProvider);
// Mount vue app
app.mount('#app');

// fetch latest block every 6s
const blockStore = useBaseStore();
const requestCounter = ref(0);
setInterval(() => {
  requestCounter.value += 1;
  if (requestCounter.value < 5) {
    // max allowed request
    blockStore.fetchLatest().finally(() => (requestCounter.value -= 1));
  }
}, 6000);
