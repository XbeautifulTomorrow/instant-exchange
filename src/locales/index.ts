import { createI18n } from "vue-i18n";
import { getDifferent } from "@/utils/index";
import zh_CN from "./zh-TW.json";
import en_US from "./en-US.json";

const LANG_MENU: any = {
  cn: "zh_CN",
  en: "en_US"
};

// 获取当前语言
function getLang() {
  // 优先 去localstore
  if (localStorage.lang) {
    const lang = localStorage.lang;
    if (Object.keys(LANG_MENU).indexOf(lang) > -1)
      // eslint-disable-next-line
      return LANG_MENU[lang];
  } else {
    let language: any = navigator.language;

    if (language.indexOf("zh") > -1) {
      localStorage.setItem("lang", "cn")
      return "zh_CN"
    } else {
      localStorage.setItem("lang", "en")
      return "en_US"
    }
  }

  // 現在只要英文
  // return "en_US";
}

const messages = {
  zh_CN: {
    ...zh_CN
  },
  en_US: {
    ...en_US
  }
};

//对比语言包json属性
// 英语>>中文
getDifferent(messages["en_US"], messages["zh_CN"]);
getDifferent(messages["zh_CN"], messages["en_US"]);

const i18n = createI18n({
  allowComposition: true,
  locale: getLang(),
  messages: messages,
  globalInjection: true,
  warnHtmlMessage: false,
  warnHtmlInMessage: "off",
  silentFallbackWarn: true,
  silentTranslationWarn: true //去除警告信息
});

// 设置当前语言
function setLang(lang: any) {
  Object.keys(LANG_MENU).forEach(key => {
    i18n.global.locale = lang;
    if (LANG_MENU[key] === lang) localStorage.setItem("lang", key);
  });
}

export { getLang, setLang, i18n };