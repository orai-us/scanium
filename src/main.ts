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

// apollo
const cache = new InMemoryCache();

const httpLink = createHttpLink({
  uri: 'http://192.168.10.63:3000',
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
