import * as http from "@/services/apiService";
const serverUrl = "/flash-exchange-server-web";


/**
 * 获取对应币种U价格
 * @param params
 */
const getCoinExchange = (params: any) => http.get(serverUrl + "/transfer/exchange", params, { showLoading: false });

/**
 * Swap
 * @param params
 */
const transferSwap = (params: any) => http.post(serverUrl + "/transfer/swap", params);

/**
 * ton支付
 * @param params
 */
const transferPaid = (params: any) => http.get(serverUrl + "/transfer/paid", params);

/**
 * 重试转账
 * @param params
 */
const transferRetry = (params: any) => http.get(serverUrl + "/transfer/retry", params);

/**
 * 闪兑分页列表
 * @param params
 */
const getHistoryList = (params: any) => http.get(serverUrl + "/transfer/swapList", params);

/**
 * 闪兑详情
 * @param params
 */
const getHistoryDetails = (params: any) => http.get(serverUrl + "/transfer/flashDetails", params);

/**
 * 默认滑点设置
 * @param params
 */
const getSlippage = (params: any) => http.get(serverUrl + "/transfer/getSlippage", params);



export {
  getCoinExchange,
  transferSwap,
  transferPaid,
  transferRetry,
  getHistoryList,
  getHistoryDetails,
  getSlippage
};