import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/store/user.js";
import { validateToken, telegramLogin } from "@/services/api/user";
import { setLocalStore, setSessionStore, getSessionStore, isEmpty } from "@/utils";

//1. 定义要使用到的路由组件  （一定要使用文件的全名，得包含文件后缀名）
import convert from '@/views/index.vue';

//2. 路由配置
const routes = [
  {
    path: '/',
    name: 'Convert',
    component: convert
  }
];

// 3. 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 切换页面重置滚动位置
router.afterEach(() => {
  window.scrollTo(0, 0);
});

router.onError((error) => {
  const pattern = /Loading chunk (\d)+ failed/g;
  const isChunkLoadFailed = error.message.match(pattern);
  if (isChunkLoadFailed) {
    window.location.reload();
    // router.replace(router.history.pending.fullPath);
  } else {
    console.log(error);
  }
});

router.beforeEach(async (to, from, next) => {
  const queryString = window.location.search;
  const params = new URLSearchParams(queryString);
  const urlParam = params.get('tgWebAppStartParam');
  const urlParams = getSessionStore("urlParams");

  if (urlParam && urlParam != urlParams) {
    // 保存邀请码
    setSessionStore('inviteCode', urlParam);

  }

  const userStore = useUserStore();
  if (userStore.isLogin) {
    const { Telegram } = (window as any)
    if (Telegram) {
      const { WebApp } = Telegram;
      WebApp.setHeaderColor("#fff")
    }

    validateToken({});
  } else {
    const { Telegram } = (window as any)
    let tg_certificate: any;
    if (Telegram) {
      const { WebApp } = Telegram;
      WebApp.setHeaderColor("#fff")
      tg_certificate = btoa(WebApp.initData);
      console.log(WebApp.version);
      console.log(tg_certificate);
    }

    if (isEmpty(tg_certificate)) {
      const { logoutApi } = useUserStore();
      logoutApi();
      next();
      return;
    }

    const inviteCode = getSessionStore("inviteCode");
    const res = await telegramLogin({
      tgEncodeStr: tg_certificate,
      inviteCode: inviteCode
    });

    if (res.code == 200) {
      if (res.data.certificate) {
        setLocalStore("certificate", res.data.certificate);
      }

      // 保存登录信息
      userStore.setLogin(res.data);
    }
  }

  next();
});

// 4. 导出router
export default router;