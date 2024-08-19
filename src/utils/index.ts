import bigNumber from "bignumber.js";
import CryptoJS from "crypto-js";
import { useUserStore } from "@/store/user";
import { useMessageStore } from "@/store/message.js";

export function openUrl(url: string) {
  if (typeof window !== "object") return;
  const u = navigator.userAgent;
  const isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);

  if (isiOS) {
    // iOS
    window.location.href = url;
    return;
  }

  // Android
  const tempWin = window.open(url, "_blank");
  if (tempWin) {
    tempWin.opener = null;
    tempWin.location.href = url;
  }
}

/**
 * @description: 深拷贝
 * @param {any} originObj
 * @return {*}
 */
// eslint-disable-next-line
export function deepClone(originObj: any) {
  // eslint-disable-next-line
  let returnObj: any;
  // 数组
  if (typeof originObj === "object") {
    returnObj = Array.isArray(originObj) ? [] : {};
    for (const i in originObj) {
      if (typeof originObj[i] === "object") {
        returnObj[i] = deepClone(originObj[i]);
      } else {
        returnObj[i] = originObj[i];
      }
    }
  }
  return returnObj;
}

/**
 * @description: 字符串加密
 * @param {*}
 * @return {*}
 */
export function encodeStr(str: string | number | boolean) {
  if (typeof window !== "object") return str;
  return window.btoa(window.encodeURIComponent(str));
}

/**
 * @description: 字符串解密
 * @param {*}
 * @return {*}
 */
export function decodeStr(str: string) {
  if (typeof window !== "object") return str;
  return window.decodeURIComponent(window.atob(str));
}

/**
 * @description:  local store set
 * @param {string} key
 * @param {string} value
 * @return {*}
 */
export function setLocalStore(key: string, value: string) {
  localStorage.setItem(key, value);
}

/**
 * @description:  local store get
 * @param {string} key
 * @param {string} value
 * @return {*}
 */
export function getLocalStore(key: string) {
  return localStorage.getItem(key) || "";
}

/**
 * @description:  local store remove
 * @param {string} key
 * @param {string} value
 * @return {*}
 */
export function removeLocalStore(key: string) {
  return localStorage.removeItem(key);
}

/**
 * @description:  local store set
 * @param {string} key
 * @param {string} value
 * @return {*}
 */
export function setSessionStore(key: string, value: string) {
  sessionStorage.setItem(key, value);
}

/**
 * @description:  local store get
 * @param {string} key
 * @param {string} value
 * @return {*}
 */
export function getSessionStore(key: string) {
  return sessionStorage.getItem(key) || "";
}

/**
 * @description:  local store remove
 * @param {string} key
 * @param {string} value
 * @return {*}
 */
export function removeSessionStore(key: string) {
  return sessionStorage.removeItem(key);
}

/**
 * @description: Copy
 */
export function onCopy(event: string) {
  const { setMessageText } = useMessageStore();
  if (!navigator.clipboard) {
    // use old commandExec() way
    const oInput = document.createElement("textarea");
    oInput.value = event;
    document.body.appendChild(oInput);
    oInput.select(); // 选择对象;
    console.log(oInput.value);
    document.execCommand("Copy"); // 执行浏览器复制命令
    setMessageText("Copy successfully")
    oInput.remove();
  } else {
    navigator.clipboard
      .writeText(event)
      .then(function () {
        setMessageText("Copy successfully");
      })
      .catch(function () {
        setMessageText("Copy failed, please try again later");
      });
  }
}

function debounce(fn: () => void, delay: number | undefined) {
  let timer: number | any;
  return function () {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn();
    }, delay);
  };
}

/**
 * @description:  resize事件监听窗口变化
 * @param {object} callback
 * @return {*}
 */
export function handleWindowResize(callback: any) {
  const cancalDebounce = debounce(callback, 300);
  window.addEventListener("resize", cancalDebounce);
}

/**
 * @description:  时间格式化
 * @param {Date} time
 * @param {string} str
 * @return {*}
 * str : yyyy-MM-dd hh-mm-ss
 */
export function timeForStr(time: string | number | Date, str: string) {
  // eslint-disable-next-line
  const date = new Date(time);
  if (!str) str = "YYYY/MM/DD HH:mm:ss";
  str = str.replace(/yyyy|YYYY/, date.getFullYear().toString());
  str = str.replace(/yy|YY/, date.getFullYear() % 100 > 9 ? (date.getFullYear() % 100).toString() : "0" + (date.getFullYear() % 100));
  const month: any = date.getMonth() + 1;
  str = str.replace(/MM/, month > 9 ? month.toString() : "0" + month);
  str = str.replace(/M/g, month);

  str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : "0" + date.getDate());
  str = str.replace(/d|D/g, date.getDate().toString());

  str = str.replace(/hh|HH/, date.getHours() > 9 ? date.getHours().toString() : "0" + date.getHours());
  str = str.replace(/h|H/g, date.getHours().toString());
  str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : "0" + date.getMinutes());
  str = str.replace(/m/g, date.getMinutes().toString());

  str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : "0" + date.getSeconds());
  str = str.replace(/s|S/g, date.getSeconds().toString());
  return str;
}

/**
 * @description 友好的时间显示
 * @param string event 时间
 */
export function timeFormat(endTime: string | number | Date) {
  if (!endTime) return "--";
  const timestamp = new Date(endTime).getTime() / 1000;

  function zeroize(num: number) {
    return (String(num).length == 1 ? "0" : "") + num;
  }

  const { currentTime } = useUserStore();
  let curTimestamp = parseInt((new Date(currentTime || "").getTime() / 1000).toString()); //当前时间戳
  let timestampDiff = curTimestamp - timestamp; // 参数时间戳与当前时间戳相差秒数
  let timeAbsolute = +Math.abs(timestampDiff); // 如果比当前时间大

  let curDate = new Date(curTimestamp * 1000); // 当前时间日期对象
  let tmDate = new Date(timestamp * 1000); // 参数时间戳转换成的日期对象

  let Y = tmDate.getFullYear(),
    m = tmDate.getMonth() + 1,
    d = tmDate.getDate();
  let H = tmDate.getHours(),
    i = tmDate.getMinutes();
  // let s = tmDate.getSeconds();
  if (timeAbsolute < 60) {
    // 一分钟以内
    if (curTimestamp > timestamp) {
      return "A moment ago";
    } else {
      return "A while";
    }
  } else if (timeAbsolute < 3600) {
    // 一小时前之内
    if (curTimestamp > timestamp) {
      return Math.floor(timeAbsolute / 60) + " minutes ago";
    } else {
      return Math.floor(timeAbsolute / 60) + " minutes later";
    }
  } else if (curDate.getFullYear() == Y && curDate.getMonth() + 1 == m && curDate.getDate() == d) {
    return "Today " + zeroize(H) + ":" + zeroize(i);
  } else {
    let newDate = new Date((curTimestamp - 86400) * 1000); // 当前时间戳减一天转换成的日期对象(昨天)
    if (timestamp > curTimestamp) {
      newDate = new Date((curTimestamp + 86400) * 1000); // 当前时间戳加一天转换成的日期对象(明天)
    }

    if (newDate.getFullYear() == Y && newDate.getMonth() + 1 == m && newDate.getDate() == d) {
      return "Yesterday " + zeroize(H) + ":" + zeroize(i);
    } else if (newDate.getFullYear() == Y && newDate.getMonth() + 1 == m && newDate.getDate() + 1 == d) {
      return "Tomorrow at " + zeroize(H) + ":" + zeroize(i);
    } else if (curDate.getFullYear() == Y) {
      // return zeroize(m) + 'Month' + zeroize(d) + 'day ' + zeroize(H) + ':' + zeroize(i);
      return `${monthFormat(zeroize(m))} ${parseInt(zeroize(d))} ${zeroize(H)}:${zeroize(i)}`;
    } else {
      // return Y + 'Year' + zeroize(m) + '月' + zeroize(d) + '日 ' + zeroize(H) + ':' + zeroize(i);
      return `${monthFormat(zeroize(m))} ${parseInt(zeroize(d))} ${zeroize(H)}:${zeroize(i)}，${Y}`;
    }
  }
}

/**
 * @description 月份转化
 * @param string event 时间
 */
function monthFormat(event: string) {
  const monthData: any = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
  };

  return monthData[parseInt(event)];
}

/**
 * 获取时间和当前相距多久
 *
 * @param startTime 开始时间
 * @param endTime   结束时间
 * @return
 */
export function dateDiff(event: string) {
  if (!event) return 0;

  const setTime = new Date(event).getTime();

  const { currentTime } = useUserStore();
  const nowTime = new Date(currentTime || "").getTime();
  if (nowTime >= setTime) return 0;

  // 按照传入的格式生成一个simpledateformate对象
  let nd = 1000 * 24 * 60 * 60; // 一天的毫秒数
  // let nh = 1000 * 60 * 60; // 一小时的毫秒数
  // let nm = 1000 * 60; // 一分钟的毫秒数
  // let ns = 1000; // 一秒钟的毫秒数;

  // 获得两个时间的毫秒时间差异
  let diff;
  diff = Number(new bigNumber(setTime).minus(nowTime));

  let day = diff / nd; // 计算差多少天
  // let hour = (diff % nd) / nh; // 计算差多少小时
  // let min = ((diff % nd) % nh) / nm; // 计算差多少分钟
  // let sec = (((diff % nd) % nh) % nm) / ns; // 计算差多少秒//输出结果

  return day;
}

/**
 * 验证json属性是否一致
 * @param jsons json
 * @param contrast 对比json
 * @returns
 */
export function getDifferent(jsons: any, contrast: any) {
  let a = deepClone(jsons);
  let b = deepClone(contrast);

  //循环遍历其中一个json对象
  for (const key in a) {
    if (typeof a[key] != "object") {
      if (key != null) {
        if (b[key] != undefined) {
          delete a[key];
          delete b[key];
        }
      }
    } else {
      if (a[key].length >= 0) {
        for (let i = 0; i < a[key].length; i++) {
          getDifferent(a[key][i], b[key][i]);
        }
      } else {
        if (b[key] != undefined) {
          getDifferent(a[key], b[key]);
        }
      }
    }
  }

  for (const keys in a) {
    if (typeof a[keys] != "object" || b[keys] == undefined) {
      console.log("error! Inconsistent json attributes");
      console.log(a);
      console.log(b);
      return;
    }
  }
}

/**
 * @description: 1-1.00 如果超出2位，比如1.255就正常显示1.255
 * @param {string} number：为你要转换的数字
 */
export const formatNumber = (num: any) => {
  if (num == null || num == undefined) {
    return 0.0;
  }
  if (num % 1 === 0) {
    return parseFloat(num).toFixed(2);
  } else {
    return parseFloat(num).toFixed(Math.max(num.toString().split(".")[1].length, 2));
  }
};

/**
 * @description: 精确小数点
 * @param {string} number：为你要转换的数字
 * @param {number} format：要保留几位小数；譬如要保留2位，则值为2
 * @param {string} zerFill:是否补零。不需要补零可以不填写此参数
 */
export const accurateDecimal = (number: any, format: number, zeroFill: boolean = false) => {

  //判断非空
  if (!isEmpty(number)) {
    //正则匹配:正整数，负整数，正浮点数，负浮点数
    if (!/^\d+(\.\d+)?$|^-\d+(\.\d+)?$/.test(number)) return number;

    let n = 1;
    for (let i = 0; i < format; i++) {
      n = n * 10;
    }

    // 向下取整
    number = Math.floor(Number(new bigNumber(number).multipliedBy(n)));
    number = new bigNumber(number).div(n);
    let str = number.toString();

    //是否补零
    if (zeroFill) {
      let index;
      if (str.indexOf(".") == -1) {
        index = format;
        str += ".";
      } else {
        index = format - (str.length - 1 - str.indexOf("."));
      }

      for (let i = 0; i < index; i++) {
        str += "0";
      }
    }
    return Number(str);
  }

  return Number(number);
};

// 数字非空验证
export const isEmpty = (ObjVal: any) => {
  if (ObjVal == "" || ObjVal == null || ObjVal == undefined || ObjVal == "undefined") {
    return true;
  } else {
    return false;
  }
}

// 验证地址正确性的函数
export const isValidEthAddress = (address: string) => {
  if (!address) return false;

  // 去除"0x"前缀
  const cleanAddress = address.toLowerCase().replace("0x", "");

  // 长度验证
  if (cleanAddress.length !== 40) {
    return false;
  }

  // 字符集验证
  const validCharacters = /^[0-9A-Fa-f]+$/;
  if (!validCharacters.test(cleanAddress)) {
    return false;
  }

  // 前缀验证
  if (!address.startsWith("0x")) {
    return false;
  }

  // const Web3 = require("web3");

  // // 初始化web3实例
  // const web3 = new Web3();

  // // 校验和验证
  // const checksumAddress = web3.utils.toChecksumAddress(address);
  // if (address !== checksumAddress) {
  //   return false;
  // }

  return true;
};

// 验证地址正确性的函数
export const isValiTronAddress = (address: string) => {
  if (!address) return false;
  // Base58字符集
  const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  // 使用正则表达式检查地址是否只包含Base58字符
  const regex = new RegExp(`^[${base58Chars}]+$`);
  if (!regex.test(address)) {
    return false;
  }
  return true;
};

// 验证 以太坊交易哈希
export const isEthTransactionHashValid = (hash: string) => {
  // 以太坊交易哈希的正则表达式
  const ethTxHashRegex = /^(0x)?[0-9a-fA-F]{64}$/;

  // 使用正则表达式进行验证
  return ethTxHashRegex.test(hash);
};

/**
 * @description: ECB模式 加密
 * @param {string} word：token
 * @param {string} keyStr：key值（16位）
 */
export const encryptECB = (word: string, keyStr: string) => {
  keyStr = keyStr || "JokerJokerXtreme"; // 密文（密钥）
  try {
    var key = CryptoJS.enc.Utf8.parse(keyStr);
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    return encrypted.toString();
  } catch {
    return word;
  }
};

/**
 * @description: ECB模式 解密
 * @param {string} word：token
 * @param {string} keyStr：key值（16位）
 */
export const decryptECB = (word: string | CryptoJS.lib.CipherParams, keyStr: string) => {
  keyStr = keyStr || "JokerJokerXtreme"; // 密文（密钥） 
  try {
    var key = CryptoJS.enc.Utf8.parse(keyStr); // Latin1 w8m31+Yy/Nw6thPsMpO5fg==
    var decrypt = CryptoJS.AES.decrypt(word, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
    return CryptoJS.enc.Utf8.stringify(decrypt).toString();
  } catch {
    return word;
  }
};

/**
 * @description: CBC模式 加密
 * @param {string} word：token
 * @param {string} keyStr：key值（16位）
 */
export const encryptCBC = (word: string, keyStr: string) => {
  keyStr = keyStr || "JokerJokerXtreme"; // 密钥

  let ivStr = "JokerLoseCyclone"; // 偏移量

  try {
    let key = CryptoJS.enc.Utf8.parse(keyStr);

    let iv = CryptoJS.enc.Utf8.parse(ivStr);

    let srcs = CryptoJS.enc.Utf8.parse(word);

    let encrypted = CryptoJS.AES.encrypt(srcs, key, {
      iv: iv,

      mode: CryptoJS.mode.CBC,

      padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.toString();
  } catch {
    return word;
  }
};

/**
 * @description:CBC模式 解密
 * @param {string} word：token
 * @param {string} keyStr：key值（16位）
 */
export const decryptCBC = (word: string, keyStr: string) => {
  keyStr = keyStr || "JokerJokerXtreme"; // 密钥

  let ivStr = "JokerLoseCyclone";

  try {
    let base64 = CryptoJS.enc.Utf8.parse(word);

    var key = CryptoJS.enc.Utf8.parse(keyStr);

    let iv = CryptoJS.enc.Utf8.parse(ivStr);

    let src = CryptoJS.enc.Utf8.stringify(base64);

    var decrypt = CryptoJS.AES.decrypt(src, key, {
      iv,

      mode: CryptoJS.mode.CBC,

      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypt.toString(CryptoJS.enc.Utf8);
  } catch {
    return word;
  }
};
/*
* 描述: tween动画算法。
* @param Number t: 动画已经执行的时间（实际上时执行多少次/帧数）
* @param Number b: 起始位置
* @param Number c: 终止位置
* @param Number d: 从起始位置到终止位置的经过时间（实际上时执行多少次/帧数）
*/
// 缓入函数
export const easeIn = (t: number, b: number, c: number, d: number) => {
  if (t >= d) t = d;
  return c * (t /= d) * t + b;
}

// 缓出函数
export const easeOut = (t: number, b: number, c: number, d: number) => {
  if (t >= d) t = d;
  return -c * (t /= d) * (t - 2) + b;
}

// 动画循环（每秒60帧）
export const rAF = (callback: TimerHandler) => {
  return window.setTimeout(callback, 1000 / 60)
}

// 格式化U
export const formatUsd = (event: number, type = 2) => {
  const num = event || 0;
  return Number(accurateDecimal(num, type)).toLocaleString();
}

// 首字母大写
export const upperFirstConcat = (strV: any) => {
  let str = strV;
  str = str.replace(/\b\w+\b/g, (word: string) => {
    return word.substring(0, 1).toUpperCase() + word.substring(1)
  })

  return str
}

// 获取地址栏参数
export const getUrlParams = (name: string) => {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

// 获取地址栏参数转成对象
export const parseURLParams = (urlString: string | URL) => {
  const url = new URL(urlString, "http://example.com");
  const params: any = new URLSearchParams(url.search);
  const paramsObject: any = {};
  for (const [key, value] of params) {
    paramsObject[key] = value;
  }
  return paramsObject;
};

// 设置cookie
export const setCookie = (name: string, value: string | null, day: number) => {
  let date = new Date();
  date.setDate(date.getDate() + day);
  document.cookie = name + "=" + value + ";expires=" + date;
}

// 获取cookie
export const getCookie = (name: string) => {
  let reg = RegExp(name + "=([^;]+)");
  let arr = document.cookie.match(reg);
  if (arr) {
    return arr[1];
  } else {
    return "";
  }
}

// 删除cookie
export const delCookie = (name: any) => {
  setCookie(name, null, -1)
}

/**
  * 单位换算
  * @param {number} val - 金额
  */

export const unitConversion = (val: number, type = 2, zeroFill = true) => {
  let h = 1;
  let kh = h * 1000;
  let mh = kh * 1000;
  let gh = mh * 1000;
  let th = gh * 1000;
  let ph = th * 1000;
  let eh = ph * 1000;
  let texts = 0 as number | string | any;
  val = Number(val || 0);
  const absVal = Math.abs(val); // 可能是负数，取绝对值比对

  if (absVal < kh) {
    texts = accurateDecimal(val, type, zeroFill);
  } else if (absVal >= kh && absVal < mh) {
    texts = accurateDecimal(val / kh, type, zeroFill) + "K";
  } else if (absVal >= mh && absVal < gh) {
    texts = accurateDecimal(val / mh, type, zeroFill) + "M";
  } else if (absVal >= gh && absVal < th) {
    texts = accurateDecimal(val / gh, type, zeroFill) + "B";
  } else if (absVal >= th && absVal < ph) {
    texts = accurateDecimal(val / th, type, zeroFill) + "T";
  } else if (absVal >= ph && absVal < eh) {
    texts = accurateDecimal(val / ph, type, zeroFill) + "P";
  } else if (absVal >= eh) {
    texts = accurateDecimal(val / eh, type, zeroFill) + "E";
  }

  return texts;
}

/**
 * Telegram分享。
 * @param {string} url - 分享链接。
 */
export const shareOnTelegram = (url: string) => {
  const inviteText = `
  💸 Turn $10 into $10,000 IN SECONDS!

🎢 RollerCoaster's 1000x multiplier awaits！

💰 Use my link for a FREE $100 RCP boost!
`;

  // 使用 encodeURIComponent 对文本进行编码
  const encodedText = encodeURIComponent(inviteText);

  // 构建分享内容的URL
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodedText}`;

  // 打开Telegram小程序或网页版Telegram进行分享
  openUrl(shareUrl);
}
