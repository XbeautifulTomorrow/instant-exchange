/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins';
import { createPinia } from 'pinia';

// Components
import App from './App.vue';
import dayjs from "dayjs";
// Components
import router from './router';
// Components
import store from './store/index';

// Composables
import { createApp } from 'vue';
const pinia = createPinia();

const app = createApp(App);
app.config.globalProperties.$dayjs = dayjs;

registerPlugins(app)
//安装pinia
app.use(pinia)
app.use(store);
app.use(router as any)
app.mount('#app')
