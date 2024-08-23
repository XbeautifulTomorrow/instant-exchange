<template>
  <div class="swap_wrapper">
    <div class="swap_panel">
      <div class="swap_item">
        <div class="swap_item_title">
          <div class="operating">Send</div>
          <div class="balance">
            <span>
              {{ `Bal: ${formatNumber(coinBalance || 0, 6)}` }}
            </span>
            <div class="max_btn" @click="handleMax()">MAX</div>
          </div>
        </div>
        <div class="swap_from_input">
          <div class="coin_box">
            <v-img
              v-if="coinName == 'GMT'"
              :width="40"
              cover
              src="@/assets/images/coin_gmt.png"
            ></v-img>
            <v-img
              v-else
              :width="40"
              cover
              src="@/assets/images/coin_ton.png"
            ></v-img>
            <span>{{ coinName == "GMT" ? "GMT" : "TON" }}</span>
          </div>
          <v-text-field
            v-model="fromAmount"
            base-color="#fff"
            bg-color="rgba(0,0,0,0)"
            color="#fff"
            variant="plain"
            hide-details="auto"
            reverse
            type="number"
            @focus="fromOrTo = true"
            placeholder="Transfer ou."
            @input="handleInput"
          ></v-text-field>
        </div>
      </div>
      <div class="convert_btn" @click="handleConvert()">
        <v-img :width="64" cover src="@/assets/images/convert.svg"></v-img>
      </div>
      <div class="swap_item">
        <div class="swap_item_title">
          <div class="operating">Receive</div>
        </div>
        <div class="swap_from_input">
          <div class="coin_box">
            <v-img
              v-if="coinName == 'GMT'"
              :width="40"
              cover
              src="@/assets/images/coin_ton.png"
            ></v-img>
            <v-img
              v-else
              :width="40"
              cover
              src="@/assets/images/coin_gmt.png"
            ></v-img>
            <span>{{ coinName != "GMT" ? "GMT" : "TON" }}</span>
          </div>
          <v-text-field
            v-model="toAmount"
            base-color="#fff"
            bg-color="rgba(0,0,0,0)"
            color="#fff"
            variant="plain"
            hide-details="auto"
            placeholder="Recive"
            type="number"
            @focus="fromOrTo = false"
            reverse
            @input="handleInput"
          ></v-text-field>
        </div>
      </div>
    </div>
    <div class="swap_buttons">
      <v-btn
        class="button swap"
        @click="isConnect ? submitSwap() : connectToWallet()"
        width="100%"
        height="48"
        rounded="lg"
        size="small"
        :disabled="isSubmit"
      >
        <div class="btn_text" v-if="isConnect">
          <span class="finished" v-if="!fromAmount || !toAmount">Swap</span>
          <span class="finished" v-else-if="coinBalance >= fromAmount">
            Review
          </span>
          <span class="finished" v-else>
            {{ `Insufficient ${coinName} balance` }}
          </span>
        </div>
        <div class="btn_text" v-else>
          <v-img :width="20" cover src="@/assets/images/icon_ton.png"></v-img>
          <span class="finished">TON Connect</span>
        </div>
      </v-btn>
    </div>
    <div class="expected_box">
      <div class="expected_item">
        <div class="expected_item_left">Swap Rate</div>
        <div class="expected_item_right" v-if="swapTONRate && swapGMTRate">
          <div v-if="coinName == 'GMT'" class="expected_item_val">
            {{ `1 GMT ≈ ${formatNumber(swapTONRate || 0, 6)} TON` }}
          </div>
          <div v-else class="expected_item_val">
            {{ `1 TON ≈ ${formatNumber(swapGMTRate || 0, 2)} GMT` }}
          </div>
          <div class="operating_box" @click="getExchangePrice()">
            <v-img
              :width="16"
              cover
              src="@/assets/images/icon_refresh.svg"
            ></v-img>
          </div>
        </div>
        <div class="expected_item_right" v-else>--</div>
      </div>
      <div class="expected_item">
        <div class="expected_item_left">Slippage</div>
        <div class="expected_item_right">
          <div class="expected_item_val">{{ `${slippageRate}%` }}</div>
          <div class="operating_box" @click="handleShowSlippage()">
            <v-img
              :width="16"
              cover
              src="@/assets/images/icon_setting.svg"
            ></v-img>
          </div>
        </div>
      </div>
      <div class="expected_item">
        <div class="expected_item_left">Service Fee</div>
        <div class="expected_item_right" v-if="serviceFee">
          <div class="expected_item_val">
            <span>
              {{
                `≈ ${formatNumber(
                  serviceFee || 0,
                  coinName == "GMT" ? 6 : 2
                )} ${coinName == "GMT" ? "TON" : "GMT"}`
              }}
            </span>
          </div>
        </div>
        <div class="expected_item_right" v-else>--</div>
      </div>
    </div>
    <history ref="history"></history>
    <slippage @setSlippage="handleSlippage"></slippage>
    <confirm :slippageVal="slippageNum" @success="handleSuccess"></confirm>
    <historyList></historyList>
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { defineComponent } from "vue";
import { transferSwap } from "@/services/api/swap";
import { useUserStore } from "@/store/user.js";
import { useMessageStore } from "@/store/message.js";

// 工具类
import bigNumber from "bignumber.js";
import { accurateDecimal, isEmpty } from "@/utils";

import history from "./convert/history.vue";
import slippage from "./convert/slippage.vue";
import confirm from "./convert/confirm.vue";
import historyList from "./convert/historyList.vue";

import { TonConnectUI, ConnectedWallet } from "@tonconnect/ui";
import { fromNano } from "@ton/ton";

type coin = "GMT" | "TON";

export default defineComponent({
  data() {
    return {
      gmtJettons: "",
      coinBalance: null as number | any, // 币种余额

      coinName: "GMT" as coin,
      fromAmount: null as number | any,
      toAmount: null as number | any,
      fromOrTo: false,
      slippageNum: 0.05 as number | any,
    };
  },
  async created() {
    this.gmtJettons =
      "0:93d1b05e7214a22569548f1addae3facde413d9c38101706542fa5ad5dac446d"; // 测试币(NEOJ)

    if (import.meta.env.MODE == "prod") {
      this.gmtJettons =
        "0:46383cd27e42443a0f40ec744fe290141fb9ab4cc6ffe8c533eea5cd2d557653"; // 正式币(GMT)
    }

    this.getExchangePrice();
  },
  components: {
    history,
    slippage,
    confirm,
    historyList,
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
    recomputeNum() {
      const { recomputeNum } = useUserStore();
      return recomputeNum;
    },
    slippageRate() {
      const { slippageNum } = this;
      const rate = new bigNumber(slippageNum || 0).multipliedBy(100).toNumber();
      return accurateDecimal(rate, 2);
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
    // 服务费
    serviceFee() {
      const { coinName, toAmount, gmtConvertUsd, tonConvertUsd } = this;
      if (!toAmount) return 0;

      let receiveFee = 0;

      if (coinName == "TON") {
        receiveFee = new bigNumber(toAmount).multipliedBy(0.003).toNumber();
        const usd = new bigNumber(1).dividedBy(gmtConvertUsd).toNumber();
        const fixedFee = new bigNumber(usd).multipliedBy(0.5).toNumber();
        const fee = new bigNumber(receiveFee).plus(fixedFee).toNumber();
        return accurateDecimal(fee, 8);
      } else {
        receiveFee = new bigNumber(toAmount).multipliedBy(0.003).toNumber();
        const usd = new bigNumber(1).dividedBy(tonConvertUsd).toNumber();
        const fixedFee = new bigNumber(usd).multipliedBy(0.5).toNumber();
        const fee = new bigNumber(receiveFee).plus(fixedFee).toNumber();
        return accurateDecimal(fee, 8);
      }
    },
    // 是否可提交
    isSubmit() {
      const { isConnect, fromAmount, toAmount, coinBalance } = this;

      let isPass = false;

      if (!isConnect) {
        return false;
      }

      if (!fromAmount || !toAmount) {
        isPass = true;
      }

      if (Number(coinBalance) < Number(fromAmount)) {
        isPass = true;
      }

      return isPass;
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
  },
  methods: {
    handleInput(event: any) {
      let {
        target: { _value },
      } = event;

      if (isEmpty(_value)) {
        return;
      }

      // 去除非数字字符
      let value = _value.replace(/[^\d.]/g, "");
      // 更新输入框的值
      if (this.fromOrTo) {
        if (this.coinName == "GMT") {
          this.fromAmount = accurateDecimal(value, 2);
        } else {
          this.fromAmount = accurateDecimal(value, 6);
        }
      } else {
        if (this.coinName == "TON") {
          this.toAmount = accurateDecimal(value, 2);
        } else {
          this.toAmount = accurateDecimal(value, 6);
        }
      }
    },
    getExchangePrice() {
      const { fetchCoinExchange } = useUserStore();
      fetchCoinExchange("GMT");
      fetchCoinExchange("TON");
    },
    // 初始化ton-connect
    async initTonConnect() {
      let miniappUrl = "https://t.me/gm_coin_test_bot/instantExchange";

      this.tonConnect = new TonConnectUI({
        manifestUrl: "https://swap.gmking.io/tonconnect-manifest.json",
      });

      if (import.meta.env.MODE == "prod") {
        miniappUrl = "https://t.me/theGMCoinBot/GMExchange";
      }
      // webapp重定向
      this.tonConnect.uiOptions = {
        twaReturnUrl: miniappUrl,
      };

      // 监听钱包链接状态
      this.tonConnect.onStatusChange(async (wallet: ConnectedWallet) => {
        if (wallet) {
          console.log("wallet", wallet);
          const { listening } = useUserStore();
          const {
            account: { address },
          } = wallet;

          const isC = this.tonConnect.connected;

          listening({
            isc: isC,
            account: address,
          });

          if (isC) {
            // 获取当前币种账户余额
            this.fetchBalance();
          }
        }
      });
    },
    async connectToWallet() {
      this.handleDisconnect();
      this.tonConnect
        .connectWallet()
        .then((res: any) => {
          console.log(res);
        })
        .catch((err: any) => {
          console.log(err);
        });
      // 如果需要，可以对connectedWallet做一些事情
    },
    // 断开连接
    async handleDisconnect() {
      const isC = this.tonConnect.connected;
      if (isC) {
        // 如果已连接，断开连接
        await this.tonConnect.disconnect();

        const { listening } = useUserStore();
        listening({
          isc: false,
          address: null,
        });
      }
    },
    // 获取余额
    async fetchBalance() {
      const { walletAddr, coinName, gmtJettons } = this;

      let fetchUrl = `https://tonapi.io/v2/accounts/${encodeURIComponent(
        walletAddr
      )}`;

      if (coinName == "GMT") {
        fetchUrl += `/jettons/${encodeURIComponent(gmtJettons)}`;
      }

      axios
        .get(fetchUrl)
        .then((res: any) => {
          if (res.status == 200) {
            if (coinName == "GMT") {
              const { balance, jetton, wallet_address } = res.data;
              this.coinBalance = new bigNumber(balance || 0)
                .dividedBy(this.formatZeroFill(jetton.decimals) || 0)
                .toNumber();

              const { setJettonAddr } = useUserStore();
              setJettonAddr(wallet_address.address);
            } else {
              this.coinBalance = fromNano(res.data.balance);
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },
    handleMax() {
      this.fromOrTo = true;
      this.fromAmount = accurateDecimal(this.coinBalance || 0, 6);
    },
    // 转换 源币种
    async handleConvert() {
      if (this.coinName == "GMT") {
        this.coinName = "TON";
      } else {
        this.coinName = "GMT";
      }

      if (this.isConnect) {
        this.fetchBalance();
      }

      this.fromOrTo = true;
      this.fromAmount = null;
    },
    // 显示滑点弹窗
    handleShowSlippage() {
      const { setShowSlippage } = useMessageStore();
      setShowSlippage(true);
    },
    // 设置滑点
    handleSlippage(evnet: number) {
      this.slippageNum = evnet;
    },
    // 提交兑换
    async submitSwap() {
      const { fromAmount, coinName } = this;

      const res = await transferSwap({
        sendCoin: coinName,
        sendAmount: fromAmount,
        receiveCoin: coinName == "GMT" ? "TON" : "GMT",
        formAddress: this.walletAddr,
        slippage: this.slippageRate,
      });
      if (res.code == 200) {
        const { setoOrderInfo, setShowConfirm } = useMessageStore();
        setoOrderInfo(res.data);
        setShowConfirm(true);
      }
    },
    handleSuccess() {
      this.$nextTick(() => {
        if (this.$refs.history) {
          (this.$refs.history as any).fetchHistoryList();
        }
      });
    },
    // 末尾补零
    formatZeroFill(event: any) {
      let str = "1";

      for (let i = 0; i < event; i++) {
        str += "0";
      }

      return str;
    },
    // 格式化数字
    formatNumber(event: number | string, type: number) {
      const num = accurateDecimal(event, type);
      return Number(num).toLocaleString(undefined, {
        maximumFractionDigits: type,
      });
    },
  },
  watch: {
    fromAmount(newV: any, oldV: any) {
      if (!this.fromOrTo) return;

      if (!newV) {
        this.toAmount = "";
      }

      const { coinName, swapGMTRate, swapTONRate } = this;

      if (coinName == "GMT") {
        const amount = new bigNumber(newV || 0)
          .multipliedBy(swapTONRate)
          .toNumber();
        this.toAmount = amount ? accurateDecimal(amount, 6) : null;
      } else {
        const amount = new bigNumber(newV || 0)
          .multipliedBy(swapGMTRate)
          .toNumber();

        this.toAmount = amount ? accurateDecimal(amount, 2) : null;
      }
    },
    toAmount(newV: any) {
      if (this.fromOrTo) return;

      if (!newV) {
        this.fromAmount = null;
      }

      const { coinName, swapGMTRate, swapTONRate } = this;

      if (coinName == "GMT") {
        const amount = new bigNumber(newV || 0)
          .multipliedBy(swapGMTRate)
          .toNumber();

        this.fromAmount = amount ? accurateDecimal(amount, 2) : null;
      } else {
        const amount = new bigNumber(newV || 0)
          .multipliedBy(swapTONRate)
          .toNumber();

        this.fromAmount = amount ? accurateDecimal(amount, 6) : null;
      }
    },
    recomputeNum(newV: number) {
      if (newV > 1) {
        const { fromOrTo } = this;

        const { showConfirm } = useMessageStore();

        if (!showConfirm) {
          useUserStore().setRecomputeNum(0);
        }

        if (fromOrTo) {
          if (!this.fromAmount) return;

          const { fromAmount, coinName, swapGMTRate, swapTONRate } = this;

          if (coinName == "GMT") {
            const amount = new bigNumber(fromAmount || 0)
              .multipliedBy(swapTONRate)
              .toNumber();

            this.toAmount = amount ? accurateDecimal(amount, 6) : null;
          } else {
            const amount = new bigNumber(fromAmount || 0)
              .multipliedBy(swapGMTRate)
              .toNumber();

            this.toAmount = amount ? accurateDecimal(amount, 2) : null;
          }
        } else {
          if (!this.toAmount) return;

          const { toAmount, coinName, swapGMTRate, swapTONRate } = this;

          if (coinName == "GMT") {
            const amount = new bigNumber(toAmount || 0)
              .multipliedBy(swapGMTRate)
              .toNumber();

            this.fromAmount = amount ? accurateDecimal(amount, 2) : null;
          } else {
            const amount = new bigNumber(toAmount || 0)
              .multipliedBy(swapTONRate)
              .toNumber();

            this.fromAmount = amount ? accurateDecimal(amount, 6) : null;
          }
        }
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initTonConnect();
    });
  },
});
</script>

<style lang="scss" scoped>
.swap_wrapper {
  margin: 0 8px;
}

.swap_item {
  border-radius: 8px;
  padding: 4px 8px;
  position: relative;

  .swap_item_title {
    display: flex;
    align-items: center;
    justify-content: space-between;

    font-style: normal;
    font-size: 16px;
    color: #adadaf;

    .balance {
      display: flex;
      align-items: center;
      color: #626262;

      .v-img {
        flex: none;
        margin-left: 4px;
      }
    }
  }
}

.swap_from_input {
  background-color: #f6f6f6;
  border-radius: 16px;
  padding: 8px;
  margin-top: 8px;
  color: #000;
  display: flex;
  align-items: center;

  .coin_box {
    display: flex;
    align-items: center;
    font-weight: 700;
    font-style: normal;
    font-size: 24px;
    background-color: white;
    color: #000;
    border-radius: 16px;
    padding: 8px 12px;

    .v-img {
      flex: none;
      margin-right: 4px;
      border-radius: 50%;
    }
  }

  :deep(.v-field__input) {
    font-size: 16px;
    padding: 0;
    min-height: 0;
    line-height: 1.2;
    font-weight: bold;

    &::-webkit-input-placeholder {
      /* WebKit, Blink, Edge */
      color: #cccccc;
    }
    &:-moz-placeholder {
      /* Mozilla Firefox 4 to 18 */
      color: #cccccc;
      opacity: 1;
    }
    &::-moz-placeholder {
      /* Mozilla Firefox 19+ */
      color: #cccccc;
      opacity: 1;
    }
    &:-ms-input-placeholder {
      /* Internet Explorer 10-11 */
      color: #cccccc;
    }
    &::-ms-input-placeholder {
      /* Microsoft Edge */
      color: #cccccc;
    }

    &::placeholder {
      /* Most modern browsers support this now. */
      color: #cccccc;
    }
  }

  .zero_fill {
    font-size: 16px;
    font-weight: 700;
    color: #b0b5c5;
  }

  .unit {
    margin-left: 4px;
    font-weight: 700;
    font-style: normal;
    font-size: 16px;
    color: #b0b5c5;
  }
}

.max_btn {
  margin-left: 4px;
  color: #0098eb;
  padding: 4px 0px;
  border-radius: 4px;
  font-weight: 400;
  font-style: normal;
  font-size: 16px;
  cursor: pointer;
}

.convert_btn {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .v-img {
    flex: none;
  }
}

.error_box {
  position: absolute;
  bottom: 4px;
  font-size: 12px;
  color: #ff0000;
}

.tips_text {
  padding: 16px 0;
  font-size: 14px;
  color: #b0b5c5;
  text-align: center;
}

.swap_buttons {
  padding: 12px 8px 0;

  .button {
    padding: 10px 0;
    text-align: center;
    font-weight: bold;
    font-style: normal;
    font-size: 20px;
    line-height: 1;
    border-radius: 8px;

    &.swap {
      background: #0098eb;
      color: #fff;
    }
  }
}

.btn_text {
  display: flex;
  align-items: center;
  justify-content: center;

  .v-img {
    flex: none;
    margin-right: 4px;
  }
}

.finished {
  text-transform: none;
  letter-spacing: 0;
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
    cursor: pointer;

    .v-img {
      flex: none;
    }
  }
}
</style>