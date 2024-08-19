<template>
  <div class="confirm_wrapper">
    <v-dialog
      v-model="showConfirm"
      width="auto"
      persistent
      transition="dialog-bottom-transition"
    >
      <div class="dialog_box" v-if="!payment">
        <div class="close_btn" @click="handleReady()">
          <v-img :width="20" cover src="@/assets/images/icon_close.svg"></v-img>
        </div>
        <div class="confirm_title">Confirm Conversion</div>
        <div class="confirm_panel">
          <div class="confirm_info">
            <div class="info_left">
              <div class="info_img">
                <v-img
                  v-if="coinName == 'GMT'"
                  :width="80"
                  cover
                  src="@/assets/images/coin_gmt.png"
                ></v-img>
                <v-img
                  v-else
                  :width="80"
                  cover
                  src="@/assets/images/coin_ton.png"
                ></v-img>
              </div>
              <div class="info_action">From</div>
              <div class="info_amount">
                {{ `${orderInfo.amount} ${coinName}` }}
              </div>
            </div>
            <div class="info_center">
              <v-img
                :width="80"
                cover
                src="@/assets/images/convert.svg"
              ></v-img>
            </div>
            <div class="info_right">
              <div class="info_img">
                <v-img
                  v-if="coinName == 'TON'"
                  :width="80"
                  cover
                  src="@/assets/images/coin_gmt.png"
                ></v-img>
                <v-img
                  v-else
                  :width="80"
                  cover
                  src="@/assets/images/coin_ton.png"
                ></v-img>
              </div>
              <div class="info_action">To</div>
              <div class="info_amount">
                {{ `${toAmount} ${coinName == "GMT" ? "TON" : "GMT"}` }}
              </div>
            </div>
          </div>
          <div class="expected_box">
            <div class="expected_item">
              <div class="expected_item_left">Swap Rate</div>
              <div class="expected_item_right">
                <div v-if="coinName == 'GMT'" class="expected_item_val">
                  {{ `1 GMT ≈ ${swapTONRate} TON` }}
                </div>
                <div v-else class="expected_item_val">
                  {{ `1 TON ≈ ${swapGMTRate} GMT` }}
                </div>
              </div>
            </div>
            <div class="expected_item">
              <div class="expected_item_left">Slippage</div>
              <div class="expected_item_right">
                <div class="expected_item_val">{{ `${slippageRate}%` }}</div>
              </div>
            </div>
            <div class="expected_item">
              <div class="expected_item_left">Service Fee</div>
              <div class="expected_item_right" v-if="serviceFee">
                <div class="expected_item_val">
                  <span>{{
                    `≈ ${serviceFee} ${coinName == "GMT" ? "TON" : "GMT"}`
                  }}</span>
                </div>
              </div>
              <div class="expected_item_right" v-else>--</div>
            </div>
          </div>
        </div>
        <div
          class="confirm_btn"
          @click="coinName == 'GMT' ? handleTransferGMT() : handleTransferTON()"
          v-if="countdown > 0"
        >
          {{ `Swap (${timeMsg})` }}
        </div>
        <div class="confirm_btn refresh" @click="getExchangePrice()" v-else>
          Refresh
        </div>
      </div>
      <div class="dialog_box" v-else>
        <div class="close_btn" @click="handleReady()">
          <v-img :width="20" cover src="@/assets/images/icon_close.svg"></v-img>
        </div>
        <div class="success_img">
          <v-img :width="80" cover src="@/assets/images/success.svg"></v-img>
        </div>
        <div class="success_title">Transaction Sent</div>
        <div class="success_msg">
          Your transaction has been sent to the network and will be processed
          within a few minutes.
        </div>
        <div class="confirm_btn" @click="handleReady()">OK</div>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { accurateDecimal } from "@/utils";
import bigNumber from "bignumber.js";
import { useUserStore } from "@/store/user.js";
import { useMessageStore } from "@/store/message.js";
import { toNano, beginCell, Address } from "@ton/ton";

type coin = "GMT" | "TON";

export default defineComponent({
  props: {
    slippageVal: {
      type: Number,
      default: 0.003,
    },
  },
  data() {
    return {
      payment: false,
      coinName: "GMT" as coin,
      toAmount: 0,
      timer: null as number | any,
      countdown: 10,
      timeMsg: "10s",
      tonwebConnect: null as any,
      keyPair: null as any,
    };
  },
  computed: {
    // GMT转化至USD价格
    gmtConvertUsd() {
      const { gmtConvertUsd } = useUserStore();
      return gmtConvertUsd;
    },
    // TON转化至USD价格
    tonConvertUsd() {
      const { tonConvertUsd } = useUserStore();
      return tonConvertUsd;
    },
    // tonConnect对象
    tonConnect: {
      get() {
        const { tonConnect } = useUserStore();
        return tonConnect;
      },
      set(val: any) {
        const { setTonConnect } = useUserStore();
        setTonConnect(val);
      },
    },
    // 链接状态
    isConnect() {
      const { isConnect } = useUserStore();
      return isConnect;
    },
    // 钱包地址
    walletAddr() {
      const { walletAddr } = useUserStore();
      return walletAddr;
    },
    // jetton地址
    jettonAddr() {
      const { jettonAddr } = useUserStore();
      return jettonAddr;
    },
    orderInfo() {
      const { orderInfo } = useMessageStore();
      return orderInfo;
    },
    showConfirm: {
      get() {
        const { showConfirm } = useMessageStore();
        return showConfirm;
      },
      set(val: boolean) {
        const { setShowConfirm, setoOrderInfo } = useMessageStore();

        if (!val) {
          this.payment = false;
          this.coinName = "GMT";
          this.toAmount = 0;
          this.timer = null;
          this.countdown = 10;
          this.timeMsg = "10s";

          setoOrderInfo({} as any);
        }

        setShowConfirm(val);
      },
    },
    // 兑换率 GMT > TON
    swapTONRate() {
      const { gmtConvertUsd, tonConvertUsd } = this;
      const rate = new bigNumber(gmtConvertUsd)
        .dividedBy(tonConvertUsd)
        .toNumber();

      return accurateDecimal(rate, 6);
    },
    // 兑换率 TON > GMT
    swapGMTRate() {
      const { gmtConvertUsd, tonConvertUsd } = this;
      const rate = new bigNumber(tonConvertUsd)
        .dividedBy(gmtConvertUsd)
        .toNumber();

      return accurateDecimal(rate, 6);
    },
    // 滑点
    slippageRate(): any {
      const { slippageVal } = this;
      const rate = new bigNumber(slippageVal).multipliedBy(100).toNumber();
      return accurateDecimal(rate, 2);
    },
    // 服务费
    serviceFee() {
      const { coinName, toAmount, gmtConvertUsd, tonConvertUsd } = this;
      if (!toAmount) return 0;

      let receiveFee = 0;
      if (coinName == "TON") {
        receiveFee = new bigNumber(toAmount).multipliedBy(0.003).toNumber();
        const usd = new bigNumber(1).dividedBy(gmtConvertUsd).toNumber();
        const fixedFee = new bigNumber(usd).multipliedBy(0.2).toNumber();
        const fee = new bigNumber(receiveFee).plus(fixedFee).toNumber();
        return accurateDecimal(fee, 8);
      } else {
        receiveFee = new bigNumber(toAmount).multipliedBy(0.003).toNumber();
        const usd = new bigNumber(1).dividedBy(tonConvertUsd).toNumber();
        const fixedFee = new bigNumber(usd).multipliedBy(0.2).toNumber();
        const fee = new bigNumber(receiveFee).plus(fixedFee).toNumber();
        return accurateDecimal(fee, 8);
      }
    },
  },
  created() {
    this.initTonweb();
  },
  methods: {
    handleReady() {
      this.showConfirm = false;
    },
    initTonweb() {},
    getExchangePrice() {
      const { fetchCoinExchange } = useUserStore();
      fetchCoinExchange("GMT");
      fetchCoinExchange("TON");
      this.countDown();
    },
    getToAmount() {
      const {
        coinName,
        orderInfo: { amount },
        swapGMTRate,
        swapTONRate,
      } = this;

      if (coinName == "GMT") {
        const amountVal = new bigNumber(amount || 0)
          .multipliedBy(swapTONRate)
          .toNumber();
        this.toAmount = amountVal ? accurateDecimal(amountVal, 6) : null;
      } else {
        const amountVal = new bigNumber(amount || 0)
          .multipliedBy(swapGMTRate)
          .toNumber();

        this.toAmount = amountVal ? accurateDecimal(amountVal, 6) : null;
      }
    },

    async handleTransferGMT() {
      const {
        walletAddr,
        jettonAddr,
        orderInfo: { publicKey, amount },
      } = this;

      const body = beginCell()
        .storeUint(0x0f8a7ea5, 32) // jetton 转账操作码
        .storeUint(0, 64) // query_id:uint64
        .storeCoins(new bigNumber(amount).multipliedBy(100).toNumber()) // amount:(VarUInteger 16) -  转账的 Jetton 金额（小数位 = 6 - jUSDT, 9 - 默认）
        .storeAddress(Address.parse(publicKey)) // destination:MsgAddress
        .storeAddress(Address.parse(walletAddr)) // response_destination:MsgAddress
        .storeUint(0, 1) // custom_payload:(Maybe ^Cell)
        .storeCoins(toNano(0.05)) // forward_ton_amount:(VarUInteger 16)
        .storeUint(0, 1) // forward_payload:(Either Cell ^Cell)
        .endCell();

      // 创建交易体
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: jettonAddr,
            amount: toNano("0.05").toString(), //以nanotons计的Toncoin
            payload: body.toBoc().toString("base64"),
          },
        ],
      };

      this.tonConnect
        .sendTransaction(transaction)
        .then((res: any) => {
          this.payment = true;
        })
        .catch((err: any) => {
          console.log(err);
        });
    },

    // 处理TON转账
    async handleTransferTON() {
      const {
        orderInfo: { publicKey, amount, remark },
      } = this;

      // 创建评论
      const body = beginCell()
        .storeUint(0, 32) // 写入32个零位以表示后面将跟随文本评论
        .storeStringTail(remark) // 写下我们的文本评论
        .endCell();

      // 创建交易体
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: (this.coinName = "GMT" ? this.jettonAddr : publicKey), // 目的地址
            amount: toNano(amount).toString(), //以nanotons计的Toncoin
            payload: body.toBoc().toString("base64"),
          },
        ],
      };

      this.tonConnect
        .sendTransaction(transaction)
        .then((res: any) => {
          this.payment = true;
        })
        .catch((err: any) => {
          console.log(err);
        });
    },
    // 倒计时
    countDown() {
      const Countdown = 10;
      if (!this.timer) {
        this.countdown = Countdown;
        this.timeMsg = this.countdown + "s";
        this.timer = setInterval(() => {
          if (this.countdown > 0 && this.countdown <= 10) {
            this.countdown--;

            if (this.countdown !== 0) {
              this.timeMsg = this.countdown + "s";
            } else {
              this.timeMsg = this.countdown + "s";
              this.clearTimerFun();
            }
          }
        }, 1000);
      }
    },
    // 清除计时器
    clearTimerFun() {
      clearInterval(this.timer);
      this.timer = null;
    },
    /**
     * @description: 格式化地址
     */
    formatAddr(event: string) {
      if (!event) return "";
      var reg = /^(\S{18})\S+(\S{6})$/;
      return event.replace(reg, "$1***$2");
    },
  },
  watch: {
    orderInfo() {
      this.coinName = this.orderInfo.coinName as coin;
      this.getToAmount();
      this.getExchangePrice();
    },
  },
  beforeUnmount() {
    this.clearTimerFun();
  },
});
</script>

<style lang="scss" scoped>
:deep(.v-overlay__content) {
  margin: 0 !important;
  max-width: max-content !important;
  bottom: 0;
}

.dialog_box {
  width: 100vw;
  background-color: #fff;
  border-radius: 4px 4px 0 0;
  padding: 16px 8px;
  display: flex;
  align-items: center;
  flex-direction: column;
  color: #fff;
  font-size: 20px;
  line-height: 1.2;
  position: relative;

  .confirm_title {
    color: #000;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .slippage_hint {
    font-size: 16px;
    color: rgba(0, 0, 0, 0.4);
    text-align: center;
  }
}

* {
  padding: 0;
  margin: 0;
}
.history_wrapper {
  margin: 0 8px;
}

ul {
  list-style: none;
}

li {
  list-style-type: none;
}

.close_btn {
  position: absolute;
  top: 16px;
  right: 16px;
}

.confirm_panel {
  padding: 8px 0;
  width: 100%;
  box-sizing: border-box;
}

.confirm_info {
  width: 100%;
  display: flex;
  align-items: flex-start;

  .info_left,
  .info_right {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info_img {
    width: 80px;
    height: 80px;

    .v-img {
      flex: none;
      border-radius: 50%;
      overflow: hidden;
    }
  }

  .info_action {
    font-weight: 700;
    font-style: normal;
    font-size: 20px;
    color: #adadaf;
    padding: 8px 0;
  }

  .info_amount {
    font-weight: 700;
    font-style: normal;
    font-size: 16px;
    color: #000;
  }
}

.info_center {
  width: 80px;
  height: 80px;

  .v-img {
    flex: none;
    transform: rotate(90deg);
  }
}

.expected_box {
  margin: 16px 8px;
  padding: 4px 8px;
  background-color: white;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.34);
  border-radius: 8px;
}

.expected_item {
  padding: 4px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.expected_item_left {
  font-size: 14px;
  color: #999999;
}

.expected_item_right {
  font-size: 14px;
  color: #2a2a2a;
  display: flex;
  align-items: center;

  .operating_box {
    margin-left: 8px;
    padding: 4px;
    border-radius: 4px;
    background-color: #f2f3f5;

    .v-img {
      flex: none;
    }
  }
}

.success_img {
  padding-top: 32px;
}

.success_title {
  padding-top: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #000;
}

.success_msg {
  padding-top: 12px;
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
  text-align: center;
}

.confirm_btn {
  margin-top: 14px;
  width: 100%;
  background-color: #0098eb;
  box-sizing: border-box;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 12px 0;

  &.refresh {
    background-color: #2b2b2b;
    color: white;
  }
}
</style>