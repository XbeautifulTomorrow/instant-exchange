import axios from "axios";
import { useUserStore } from "@/store/user.js";
import config from "./env";
import { useMessageStore } from "@/store/message.js";
import { getLocalStore } from "@/utils";

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: config.api,
  withCredentials: true,
  timeout: 300000,
});

// 希望控制报错信息，就把接口地址写这里
const notMessage: any = [
  "/coaster-server-web/carOrder/closeOrder"
];

/* 请求合并只出现一次loading */
let needLoadingRequestCount = 0;
/* 计时器对象 */
let timer = null as any;

function showFullScreenLoading() {
  if (needLoadingRequestCount === 0) {
    loading('start') /* loading加载 */
  }
  needLoadingRequestCount++
}

function tryHideFullScreenLoading() {
  if (needLoadingRequestCount <= 0) return
  needLoadingRequestCount--
  if (needLoadingRequestCount === 0) {
    if (timer) clearTimeout(timer);
    loading('end') /* loading结束 */
  }
}
/* loading加载 */
function loading(str: string) {
  const { setShowLoading } = useMessageStore();
  if (str == 'start') {
    timer = setTimeout(() => {
      setShowLoading(true);
    }, 300) /* 300ms 间隔内的 loading 合并为一次 */

  } else if (str == 'end') {
    setShowLoading(false);
  }
}



// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: any) => {

    if (getLocalStore("certificate")) {
      config.headers.certificate = getLocalStore("certificate");
    }

    if (config.showLoading) {
      showFullScreenLoading()
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response: any) => {
    if (response.config.showLoading) {
      tryHideFullScreenLoading()
    }

    return response;
  },
  (error) => {

    tryHideFullScreenLoading() // 消除loading
    const { setMessageText } = useMessageStore();
    setMessageText("Network is unstable, please check your network.");

    return Promise.reject(error);
  }
);

const handleRes = ({ response, url, data }: any) => {

  // 取得服务器时间
  const { setCurrentTime } = useUserStore();
  if (data && data.localDateTime) {
    setCurrentTime(data.localDateTime);
  }

  if (data.code === 200 || data.status === 200) {
    return data;
  } else if (data.code === 20011) {
    const { logoutApi } = useUserStore();
    logoutApi();
    return [false, data.code, data];
  } else {
    if (!notMessage.includes(url)) {
      const { setMessageText } = useMessageStore();
      setMessageText(data.message);
    }

    if (notMessage.includes(url)) {
      return response;
    } else {
      return [false, data.code, data];
    }
  }
};

export async function post(url: any, params: object = {}, config = { showLoading: true } as any) {
  try {
    const res = await axiosInstance.post(url, params, config);
    return handleRes({
      response: res,
      url,
      data: res.data,
    });
  } catch (err: any) {
    console.warn(err);
    err.message = "error";
    return err;
  }
}

export async function get(url: any, params: object = {}, config = { showLoading: true } as any) {
  try {
    const res = await axiosInstance.get(url, { ...config, params });
    return handleRes({
      response: res,
      url,
      data: res.data,
    });
  } catch (err: any) {
    console.warn(err);
    err.message = "error";
    return err;
  }
}