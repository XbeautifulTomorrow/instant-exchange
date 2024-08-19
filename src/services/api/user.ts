import * as http from "@/services/apiService";
const serverUrl = "/flash-exchange-server-web";

/**
 * Telegram验证
 * @param params
 */
const validateToken = (params: any) => http.get(serverUrl + "/tg-user/validate", params, { showLoading: false });
/**
 * Telegram登录
 * @param params
 */
const telegramLogin = (params: any) => http.post(serverUrl + "/tg-user/login", params);


/**
 * 订单列表
 * @param params
 */
const getOrderList = (params: any) => http.get(serverUrl + "/order/list", params, { showLoading: false });

export {
  validateToken,
  telegramLogin,
  getOrderList
};