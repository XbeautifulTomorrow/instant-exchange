<template>
  <div class="history_wrapper">
    <v-dialog
      v-model="showHistoryList"
      width="auto"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <div class="dialog_box" @scroll="handleScroll">
        <div class="close_btn" @click="handleReady()">
          <v-img :width="20" cover src="@/assets/images/icon_close.svg"></v-img>
        </div>
        <div class="history_title">History</div>
        <transition-group name="list" tag="ul">
          <li class="list_item" v-for="item in historyData" :key="item.timeDay">
            <div class="history_time">
              {{
                item.timeDay == currentDay ? "Today" : formatTime(item.timeDay)
              }}
            </div>
            <div
              class="history_item"
              v-for="(event, index) in item.order"
              :key="index"
              @click="handleShowDetails(event)"
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
                        event.receiveAddress
                          ? formatAddr(event.receiveAddress)
                          : "--"
                      }}
                    </div>
                  </div>
                </div>
                <div class="history_item_info_right">
                  <div v-if="event.status == 4" class="receive">
                    {{
                      `+${formatNumber(
                        event.receiveAmount,
                        event.receiveCoin == "GMT" ? 2 : 6
                      )} ${event.receiveCoin}`
                    }}
                  </div>
                  <div class="status fail" v-else-if="event.status == 5">
                    <div>Fail</div>
                    <div class="retry_btn" @click="handleRetry(event)">
                      <countDown
                        v-if="event.isRetry"
                        v-slot="timeObj"
                        :time="event.nextRetryTime"
                        @onEnd="event.isRetry = false"
                      >
                        <span class="retry_btn_text">
                          {{ `Retry (${timeObj.sAll})` }}
                        </span>
                      </countDown>
                      <span v-else>Retry</span>
                    </div>
                  </div>
                  <div class="status cancelled" v-else-if="event.status == 6">
                    Cancelled
                  </div>
                  <div class="status in_progress" v-else>In Progress</div>
                  <div class="send">
                    {{
                      `-${formatNumber(
                        event.sendAmount,
                        event.sendCoin == "GMT" ? 2 : 6
                      )} ${event.sendCoin}`
                    }}
                  </div>
                </div>
              </div>
              <div class="history_item_time">
                {{ timeForStr(event.createTime, "HH:mm:ss") }}
              </div>
            </div>
          </li>
        </transition-group>
        <orderDetails :historyId="historyId"></orderDetails>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import orderDetails from "./orderDetails.vue";
import { useMessageStore } from "@/store/message.js";
import { getHistoryList } from "@/services/api/swap";
import { timeForStr, accurateDecimal } from "@/utils";
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
  data() {
    return {
      historyList: [] as Array<orderInfo>,
      historyId: null as any,
      currentDay: "",
      page: 1,
      size: 10,
      finished: false,
    };
  },
  components: {
    orderDetails,
    countDown,
  },
  created() {
    this.fetchHistoryList();
  },
  computed: {
    showHistoryList: {
      get() {
        const { showHistoryList } = useMessageStore();
        return showHistoryList;
      },
      set(val: boolean) {
        const { setShowHistoryList } = useMessageStore();

        setShowHistoryList(val);
      },
    },
    historyData() {
      const { historyList } = this;

      let historyArray = [] as Array<{
        timeDay: string;
        order: Array<orderInfo>;
      }>;
      let times = "";
      let array = [] as Array<orderInfo>;

      for (let i = 0; i < historyList.length; i++) {
        const element = historyList[i];
        const timeDay = timeForStr(element.createTime, "YYYY-MM-DD");

        if (!times) {
          times = timeDay;
        } else if (timeDay != times) {
          historyArray.push({
            timeDay: times,
            order: array,
          });

          times = timeDay;
          array = [];
        }

        if (times == timeDay) {
          array.push(element);
        }

        if (i == historyList.length - 1) {
          historyArray.push({
            timeDay: times,
            order: array,
          });
        }
      }
      return historyArray;
    },
  },
  methods: {
    timeForStr: timeForStr,
    accurateDecimal: accurateDecimal,
    handleReady() {
      this.showHistoryList = false;
    },
    async fetchHistoryList(type = 1, isSearch = true) {
      let _page = this.page;
      if (isSearch) {
        this.finished = false;
        this.page = 1;
        _page = 1;
      }

      const res = await getHistoryList({ page: _page, size: this.size });
      if (res.code == 200) {
        if (res.data.current >= res.data.pages) {
          this.finished = true;
        }
        if (type == 1) {
          this.historyList = res.data.records;
        } else {
          this.historyList.push.apply(this.historyList, res.data.records);
        }

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
    async handleRetry(event: orderInfo) {
      if (event.isRetry) return;
      const res = await transferRetry({ flashId: event.flashId });
      if (res.code == 200) {
        this.fetchHistoryList();
      }
    },
    // 处理滚动事件
    async handleScroll(event: Event) {
      const target = event.target as HTMLElement;
      const bottom =
        target.scrollHeight === target.scrollTop + target.clientHeight;

      if (bottom && !this.finished) {
        this.page++;
        this.fetchHistoryList(2, false);
      }
    },
    formatTime(event: string) {
      const time = new Date(event);

      var monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return `${time.getDate()} ${monthNames[time.getMonth()]}`;
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
    // 格式化数字
    formatNumber(event: number | string, type: number) {
      const num = accurateDecimal(event, type);
      return Number(num).toLocaleString(undefined, {
        maximumFractionDigits: type,
      });
    },
  },
  watch: {
    showHistoryList(val: boolean) {
      if (val) {
        this.fetchHistoryList();
        const { currentTime } = useUserStore();
        this.currentDay = timeForStr(currentTime, "YYYY-MM-DD");
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.dialog_box {
  width: 100vw;
  height: 100vh;
  overflow-y: scroll;
  background-color: #fff;
  border-radius: 0;
  padding: 0 8px;
  color: #fff;
  font-size: 20px;
  line-height: 1.2;
  position: relative;
  box-sizing: border-box;

  .history_title {
    color: #000;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 8px;
    text-align: left;
    padding: 16px 0;
  }
}

.close_btn {
  position: absolute;
  top: 16px;
  right: 16px;
}

* {
  padding: 0;
  margin: 0;
}
* {
  padding: 0;
  margin: 0;
}

ul {
  list-style: none;
}

li {
  list-style-type: none;
}

.history_time {
  font-size: 16px;
  padding: 8px 0;
  color: #000;
  font-weight: bold;
}

.list_item {
  opacity: 1;
  transition: opacity 0.5s, transform 0.5s ease;
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

.history_item {
  padding: 8px;
  cursor: pointer;
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
      color: #000;
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
    color: #000;
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-weight: 700;
    font-style: normal;
    font-size: 16px;

    &.in_progress {
      color: #0098eb;
    }

    &.fail {
      color: #ff0101;
    }

    &.cancelled {
      color: #c8c8c8;
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
  }

  .retry_btn_text {
    color: #c4c4c4;
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