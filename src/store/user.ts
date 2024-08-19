import { defineStore } from "pinia";
import { getLocalStore, setSessionStore, getSessionStore } from "@/utils";

import { getCoinExchange } from "@/services/api/swap";
import { en, zhHant } from 'vuetify/locale'
import { getLang } from "@/locales/index";

const langMenu: any = {
  zh_CN: en,
  en_US: zhHant
};

export interface logInterface {
  id: string | number, //用户ID
  userName: string, //用户名
  email: string, //邮箱
  roleId: number | string,
  ip: string, // 登录IP
  certificate: string, //用户Token
  createTime: string, // 注册时间
  tgId: number | string //tgID
}

export const useUserStore = defineStore("user", {
  state: () => ({
    locale: langMenu[getLang()],
    logInfo: {} as logInterface,
    currentTime: null as string | any,
    isLogin: getLocalStore("certificate") ? true : false,
    tonConnect: null as any, // 链接对象
    isConnect: false,     //链接状态
    walletAddr: null as string | any,     // 钱包地址
    jettonAddr: null as string | any,

    gmtConvertUsd: null as number | any, // GMT转化至USD价格
    tonConvertUsd: null as number | any, // TON转化至USD价格

    retryCount: 5, // 登录重试次数
    loadLog: false,
  }),
  persist: {
    enabled: true,
    strategies: [
      { key: "logInfo", storage: localStorage, paths: ["logInfo"] },
      { key: "retryCount", storage: sessionStorage, paths: ["retryCount"] }
    ],
  },
  actions: {
    setLogin(data: any) {
      this.logInfo = data;
      this.isLogin = true;
    },
    setLoad(data: any) {
      this.loadLog = data;
    },
    setTonConnect(data: any) {
      this.tonConnect = data;
    },
    listening(data: any) {
      if (data.isc) {
        this.isConnect = true;
        this.walletAddr = data.account;
      } else {
        this.isConnect = false;
        this.walletAddr = null;
      }
    },
    setJettonAddr(data: any) {
      this.jettonAddr = data;
    },
    setLocale(data: any) {
      this.locale = data == "en_US" ? en : zhHant;
    },
    setCurrentTime(data: any) {
      this.currentTime = data;
    },
    async fetchCoinExchange(data: any) {
      const res = await getCoinExchange({
        source: data,
      });
      if (res.code == 200) {
        if (data == "GMT") {
          this.gmtConvertUsd = res.data;
        } else {
          this.tonConvertUsd = res.data;
        }
      }
    },
    async logoutApi() {
      const invateCode = getSessionStore("invateCode");
      sessionStorage.clear();
      setSessionStore("invateCode", invateCode);

      localStorage.removeItem("logInfo");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("certificate");
      this.isLogin = false;
      window.NavigationPreloadManager;

      if (import.meta.env.MODE != "dev") {
        if (this.retryCount > 0) {
          window.location.reload();
        }

        this.retryCount--;
      }
    }
  }
});