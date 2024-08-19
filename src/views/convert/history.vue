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
            <div class="receive">
              {{ `+${item.receiveAmount} ${item.receiveCoin}` }}
            </div>
            <div class="send">{{ `-${item.sendAmount} ${item.sendCoin}` }}</div>
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
import { timeForStr } from "@/utils";

interface orderInfo {
  flashId: number; //闪兑订单ID
  receiveAddress: string; //收款地址
  sendCoin: string; //源币种
  receiveCoin: string; //兑换币种
  sendAmount: number; //源币种数量
  receiveAmount: number; //兑换币种数量
  createTime: string; //时间
  status: string;
  statusStr: string; //状态
}

export default defineComponent({
  data() {
    return {
      historyList: [] as Array<orderInfo>,
      historyId: null as any,
    };
  },
  components: {
    orderDetails,
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
    async fetchHistoryList() {
      const res = await getHistoryList({ page: 1, size: 5 });
      if (res.code == 200) {
        this.historyList = res.data.records;
      }
    },
    handleShowDetails(event: orderInfo) {
      const { setShowDetails } = useMessageStore();
      this.historyId = event.flashId;
      setShowDetails(true);
    },
    /**
     * @description: 格式化地址
     */
    formatAddr(event: string) {
      if (!event) return "";
      var reg = /^(\S{18})\S+(\S{6})$/;
      return event.replace(reg, "$1***$2");
    },
    // 更多历史
    toHistory() {
      const { setShowHistoryList } = useMessageStore();
      setShowHistoryList(true);
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
  }
}

.history_item {
  padding: 8px;
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
}

.history_item_time {
  font-weight: 400;
  font-style: normal;
  text-align: right;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.4);
}
</style>