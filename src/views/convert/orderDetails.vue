<template>
  <div class="order_details_wrapper">
    <v-dialog
      v-model="showDetails"
      width="auto"
      transition="dialog-bottom-transition"
    >
      <div class="dialog_box">
        <div class="close_btn" @click="handleReady()">
          <v-img :width="20" cover src="@/assets/images/icon_close.svg"></v-img>
        </div>
        <div class="swap_coin">
          <div class="from_coin">
            <v-img
              :width="80"
              v-if="history.sendCoin == 'GMT'"
              cover
              src="@/assets/images/coin_gmt.png"
            ></v-img>
            <v-img
              :width="80"
              v-else
              class="coin_ton"
              cover
              src="@/assets/images/icon_ton.svg"
            ></v-img>
          </div>
          <div class="to_coin">
            <v-img
              :width="80"
              v-if="history.receiveCoin == 'GMT'"
              cover
              src="@/assets/images/coin_gmt.png"
            ></v-img>
            <v-img
              :width="80"
              v-else
              class="coin_ton"
              cover
              src="@/assets/images/icon_ton.svg"
            ></v-img>
          </div>
        </div>
        <div class="swap_amount">
          <div class="from_val">
            {{
              `-${formatNumber(
                history.actualSendAmount || 0,
                history.sendCoin == "GMT" ? 2 : 6
              )} ${history.sendCoin}`
            }}
          </div>
          <div class="to_val">
            {{
              `+${formatNumber(
                history.actualReceiveAmount || 0,
                history.receiveCoin == "GMT" ? 2 : 6
              )} ${history.receiveCoin}`
            }}
          </div>
          <div class="convert_val">
            {{ `$${formatNumber(exchangeUsd || 0, 4)}` }}
          </div>
        </div>
        <div class="other_box">
          <div class="recipient_box">
            <div class="title">Recipient address</div>
            <div class="address">
              {{
                history.receiveAddress
                  ? formatAddr(history.receiveAddress)
                  : "--"
              }}
            </div>
          </div>
          <div class="fee_box">
            <div class="title">Service Fee</div>
            <div class="val">
              {{
                `${formatNumber(
                  history.fee || 0,
                  history.receiveCoin == "GMT" ? 2 : 6
                )} ${history.receiveCoin}`
              }}
            </div>
          </div>
          <div class="convert_box">
            {{ `$ ${formatNumber(usdFee || 0, 4)}` }}
          </div>
        </div>
        <div
          class="external_link_btn"
          @click="handleOpenLink(history.paymentHash)"
        >
          <v-img
            :width="24"
            cover
            src="@/assets/images/icon_global.svg"
          ></v-img>
          <span class="btn_text">Transaction</span>
          <span class="hash">{{ formatHash(history.paymentHash) }}</span>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getHistoryDetails } from "@/services/api/swap";
import { useMessageStore } from "@/store/message.js";
import { useUserStore } from "@/store/user.js";
import bigNumber from "bignumber.js";
import { accurateDecimal, openUrl } from "@/utils";
import { Address } from "@ton/ton";

interface orderInfo {
  id: number; //闪兑订单ID
  receiveAddress: string; //收款地址
  sendCoin: string; //源币种
  receiveCoin: string; //兑换币种
  sendAmount: number; //源币种数量
  receiveAmount: number; //兑换币种数量
  actualSendAmount: number; // 实际发送数量
  actualReceiveAmount: number; // 实际兑现数量
  createTime: string; //时间
  status: number;
  statusStr: string; //状态
  fee: number; //手续费
  exchange: number; //兑换币种U价值
  paymentHash: string; //打款Hash
}

export default defineComponent({
  props: {
    historyId: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      history: {} as orderInfo,
    };
  },
  computed: {
    // GMT转化至USD价格
    gmtConvertUsd() {
      const { gmtConvertUsd } = useUserStore();
      return gmtConvertUsd;
    },

    // 实际接收的数量转化USD价值
    exchangeUsd() {
      const {
        history: { actualReceiveAmount, exchange },
      } = this;

      const exchangeVal = new bigNumber(actualReceiveAmount || 0)
        .multipliedBy(exchange || 0)
        .toNumber();

      return accurateDecimal(exchangeVal, 4);
    },
    // TON转化至USD价格
    tonConvertUsd() {
      const { tonConvertUsd } = useUserStore();
      return tonConvertUsd;
    },
    showDetails: {
      get() {
        const { showDetails } = useMessageStore();
        return showDetails;
      },
      set(val: boolean) {
        const { setShowDetails } = useMessageStore();
        setShowDetails(val);
      },
    },
    usdFee() {
      const { gmtConvertUsd, tonConvertUsd, history } = this;
      if (history.receiveCoin == "GMT") {
        const usdFee = new bigNumber(history.fee)
          .multipliedBy(gmtConvertUsd)
          .toNumber();

        return usdFee;
      } else {
        const usdFee = new bigNumber(history.fee)
          .multipliedBy(tonConvertUsd)
          .toNumber();
        return usdFee;
      }
    },
  },
  methods: {
    accurateDecimal: accurateDecimal,
    handleReady() {
      this.showDetails = false;
    },
    async fetchHistoryDetails() {
      const res = await getHistoryDetails({ flashId: this.historyId });
      if (res.code == 200) {
        this.history = res.data;
        const { fetchCoinExchange } = useUserStore();
        fetchCoinExchange(this.history.receiveCoin);
      }
    },
    /**
     * @description: 格式化地址
     */
    formatAddr(event: string) {
      if (!event) return event;
      const addr = Address.parse(event).toString({
        bounceable: false,
      });
      var reg = /^(\S{8})\S+(\S{6})$/;
      return addr.replace(reg, "$1...$2");
    },
    /**
     * @description: 格式化Hash地址
     */
    formatHash(event: string) {
      if (!event) return "";
      return event.substring(0, 10);
    },
    handleOpenLink(event: string) {
      const url = `https://tonviewer.com/transaction/`;
      openUrl(url + event);
    },
    formatNumber(event: number | string, type: number) {
      const num = accurateDecimal(event, type);
      return Number(num).toLocaleString(undefined, {
        maximumFractionDigits: type,
      });
    },
  },
  watch: {
    historyId(val: number) {
      if (val) {
        this.fetchHistoryDetails();
      }
    },
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
  padding: 16px;
  display: flex;
  align-items: center;
  flex-direction: column;
  color: #fff;
  font-size: 20px;
  line-height: 1.2;
  position: relative;

  .rules_title {
    color: #fdefd6;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 4px;
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

.swap_coin {
  display: flex;
  align-items: center;

  .from_coin {
    z-index: 1;
  }

  .to_coin {
    z-index: 2;
    margin-left: -26px;
  }
}

.swap_amount {
  padding-top: 14px;
  text-align: center;
  font-weight: bold;
  font-style: normal;
  font-size: 20px;

  .from_val {
    color: rgba(0, 0, 0, 0.4);
  }

  .to_val {
    color: rgba(8, 151, 5, 1);
  }

  .convert_val {
    padding-top: 8px;
    font-weight: 400;
    font-size: 18px;
    color: rgba(24, 26, 24, 1);
  }
}

.other_box {
  width: 100%;
  background-color: #f6f6f6;
  border-radius: 12px;
  padding: 8px;
  margin-top: 8px;
}

.recipient_box {
  .title {
    font-size: 14px;
    color: #797979;
  }

  .address {
    font-weight: 700;
    font-style: normal;
    font-size: 16px;
    color: #4a4a4a;
    padding: 4px 0;
    border-bottom: 1px solid #797979;
  }
}

.fee_box {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .title {
    font-size: 14px;
    color: #797979;
  }

  .val {
    font-weight: 700;
    font-style: normal;
    font-size: 16px;
    color: #4a4a4a;
  }
}

.convert_box {
  padding-top: 4px;
  text-align: right;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  color: #999999;
}

.external_link_btn {
  margin-top: 14px;
  width: 100%;
  background-color: #ffffff;
  box-sizing: border-box;
  border: 1px solid #c4c4c4;
  border-radius: 50px;
  box-shadow: none;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  padding: 10px 0;

  .btn_text {
    padding: 0 4px;
  }

  .hash {
    color: rgba(0, 0, 0, 0.35);
  }

  .v-img {
    flex: none;
  }
}
</style>