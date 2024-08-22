<template>
  <div class="history_wrapper">
    <div class="history_nav">
      <div class="history_nav_left">Last Record</div>
      <div class="history_nav_right" @click="toHistory()">More Record</div>
    </div>
    <transition-group name="list" tag="ul">
      <li
        class="history_item"
        @click="handleShowDetails(item)"
        v-for="item in historyList"
        :key="item.flashId"
      >
        <div class="history_item_info">
          <div class="history_item_info_left">
            <div class="coin_icon">
              <v-img
                :width="64"
                cover
                src="@/assets/images/icon_operating.svg"
              ></v-img>
            </div>
            <div class="operating">
              <div class="coin">Swap</div>
              <div class="address">
                {{
                  item.receiveAddress ? formatAddr(item.receiveAddress) : "--"
                }}
              </div>
            </div>
          </div>
          <div class="history_item_info_right">
            <div v-if="item.status == 4" class="receive">
              <span v-if="item.receiveCoin == 'GMT'">
                {{
                  `+${formatNumber(item.receiveAmount, 2)} ${item.receiveCoin}`
                }}
              </span>
              <span v-else>
                {{
                  `+${formatNumber(item.receiveAmount, 6)} ${item.receiveCoin}`
                }}
              </span>
            </div>
            <div class="status fail" v-else-if="item.status == 5">
              <div>Fail</div>
              <div class="retry_btn" @click="handleRetry(item)">
                <countDown
                  v-if="item.isRetry"
                  v-slot="timeObj"
                  :time="item.nextRetryTime"
                  @onEnd="item.isRetry = false"
                >
                  <span class="retry_btn_text">
                    {{ `Retry (${timeObj.sAll})` }}
                  </span>
                </countDown>
                <span v-else>Retry</span>
              </div>
            </div>
            <div class="status in_progress" v-else>In Progress</div>
            <div class="send">
              <span v-if="item.sendCoin == 'GMT'">
                {{ `-${formatNumber(item.sendAmount, 2)} ${item.sendCoin}` }}
              </span>
              <span v-else>
                {{ `-${formatNumber(item.sendAmount, 6)} ${item.sendCoin}` }}
              </span>
            </div>
          </div>
        </div>
        <div class="history_item_time">
          {{ timeForStr(item.createTime, "YYYY-MM-DD HH:mm:ss") }}
        </div>
      </li>
    </transition-group>
    <orderDetails v-if="!showHistoryList" :historyId="historyId"></orderDetails>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import orderDetails from "./orderDetails.vue";
import { useMessageStore } from "@/store/message.js";
import { getHistoryList } from "@/services/api/swap";
import { accurateDecimal, timeForStr } from "@/utils";
import { useUserStore } from "@/store/user";
import { transferRetry } from "@/services/api/swap";
import { Address } from "@ton/ton";

import countDown from "@/components/countDown/index.vue";

interface orderInfo {
  flashId: number; //闪兑订单ID
  receiveAddress: string; //收款地址
  sendCoin: string; //源币种
  receiveCoin: string; //兑换币种
  sendAmount: number; //源币种数量
  receiveAmount: number; //兑换币种数量
  createTime: string; //时间
  nextRetryTime: string | number | any; // 重新尝试时间
  status: number; // 状态 0-未付款，1-转账中，2-进行中，3-打款中，4-成功，5-失败
  isRetry: boolean; // 前端计算的状态
  statusStr: string; //状态
}

export default defineComponent({
  name: "history",
  data() {
    return {
      historyList: [] as Array<orderInfo>,
      historyId: null as any,
    };
  },
  components: {
    orderDetails,
    countDown,
  },
  computed: {
    showHistoryList() {
      const { showHistoryList } = useMessageStore();
      return showHistoryList;
    },
  },
  async created() {
    this.fetchHistoryList();
  },
  methods: {
    timeForStr: timeForStr,
    accurateDecimal: accurateDecimal,
    async fetchHistoryList() {
      const res = await getHistoryList({ page: 1, size: 1 });
      if (res.code == 200) {
        this.historyList = res.data.records;

        for (let i = 0; i < this.historyList.length; i++) {
          const element = this.historyList[i];

          this.historyList[i].isRetry = this.formatRetry(element.nextRetryTime);
        }
      }
    },
    handleShowDetails(event: orderInfo) {
      if (event.status != 4) return;
      const { setShowDetails } = useMessageStore();
      this.historyId = event.flashId;
      setShowDetails(true);
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
    // 更多历史
    toHistory() {
      const { setShowHistoryList } = useMessageStore();
      setShowHistoryList(true);
    },
    // 是否可以重试
    formatRetry(event: string) {
      const { currentTime } = useUserStore();
      if (!event) return true;

      const current = new Date(currentTime).getTime();
      const endstamp = new Date(event).getTime();
      if (endstamp > current) {
        return true;
      } else {
        return false;
      }
    },
    // 重试打款
    async handleRetry(event: orderInfo) {
      if (event.isRetry) return;
      const res = await transferRetry({ flashId: event.flashId });
      if (res.code == 200) {
        this.fetchHistoryList();
      }
    },
    // 格式化数字
    formatNumber(event: number | string, type: number) {
      const num = accurateDecimal(event, type);
      return Number(num).toLocaleString(undefined, {
        maximumFractionDigits: type,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
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

.history_nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: #000;
  margin-bottom: 8px;

  .history_nav_right {
    color: rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }
}

.history_item {
  padding: 8px;
  opacity: 1;
  transition: opacity 0.5s, transform 0.5s ease;
  cursor: pointer;
}

.list-enter-active,
.list-leave-active {
  transition: transform 0.5s ease;
}

.list-enter,
.list-leave-to {
  position: absolute;
}

.list-enter {
  transform: translateY(-100%);
}

.list-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.history_item_info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history_item_info_left {
  display: flex;
  align-items: center;

  .operating {
    .coin {
      font-weight: 700;
      font-style: normal;
      font-size: 16px;
    }

    .address {
      font-weight: 400;
      font-style: normal;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.4);
    }
  }

  .coin_icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #0098ea;
    transform: scale(1.2);
    margin: 0 12px 0 8px;
  }
}

.history_item_info_right {
  .receive {
    font-weight: 700;
    font-style: normal;
    font-size: 16px;
    color: #089705;
    text-align: right;
  }

  .send {
    font-weight: 700;
    font-style: normal;
    font-size: 16px;
    text-align: right;
  }

  .status {
    display: flex;
    align-items: center;
    font-weight: 700;
    font-style: normal;
    font-size: 16px;

    &.in_progress {
      color: #0098eb;
    }

    &.fail {
      color: #ff0101;
    }
  }

  .retry_btn {
    background-color: #f2f3f5;
    border-radius: 4px;
    padding: 2px 6px;
    margin-left: 4px;
    font-weight: 400;
    color: #333333;
    cursor: pointer;

    .retry_btn_text {
      color: #c4c4c4;
    }
  }
}

.history_item_time {
  font-weight: 400;
  font-style: normal;
  text-align: right;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.4);
}
</style>