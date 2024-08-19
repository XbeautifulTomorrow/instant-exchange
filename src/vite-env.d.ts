/// <reference types="vite/client" />
import { VueRouter, RouteLocationNormalizedLoaded } from 'vue-router';
import { ComponentCustomProperties } from 'vue';

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@vue/runtime-core' {
  // Provide typings for `this.$router`
  interface ComponentCustomProperties {
    $route: RouteLocationNormalizedLoaded;
    $router: VueRouter;
  }
}