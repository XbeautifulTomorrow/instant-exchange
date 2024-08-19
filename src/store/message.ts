import { defineStore } from "pinia";

export interface orderInterface {
  flashId: number, //闪兑订单ID
  walletAddress: string, //充值钱包地址
  publicKey: string, //充值钱包公钥
  amount: number, //数量
  coinName: string, //源币种
  remark: string //备注
}

export const useMessageStore = defineStore("message", {
  state: () => ({
    showMessage: false, // 全局提示显示   
    messageText: "",
    showLoading: false, // 全局loading显示
    showDetails: false, // 详情显示
    showSlippage: false, // 滑点显示
    showConfirm: false, // 确认弹窗
    orderInfo: {} as orderInterface,

    showHistoryList: false // 闪兑记录
  }),
  actions: {
    setMessageText(data: any) {
      this.messageText = data;
      this.showMessage = true;
    },
    setShowMessage(data: boolean) {
      this.showMessage = data;
    },
    setShowLoading(data: boolean) {
      this.showLoading = data;
    },
    setShowDetails(data: boolean) {
      this.showDetails = data;
    },
    setShowSlippage(data: boolean) {
      this.showSlippage = data;
    },
    setShowConfirm(data: boolean) {
      this.showConfirm = data;
    },
    setoOrderInfo(data: orderInterface) {
      this.orderInfo = data;
    },
    setShowHistoryList(data: boolean) {
      this.showHistoryList = data;
    },
  },
});