<template>
  <transition-group name="toast">
    <div
      v-for="(toast, index) in toasts"
      :key="toast.index"
      class="toast-container"
      :style="getToastContainerStyle(index)"
    >
      <div class="order_box">
        <div class="status_box">
          <v-img
            :width="30"
            cover
            class="status_img"
            v-if="toast.side == 'sell'"
            src="@/assets/images/svg/game/drop.svg"
          ></v-img>
          <v-img
            :width="30"
            cover
            class="status_img"
            v-else
            src="@/assets/images/svg/game/up.svg"
          ></v-img>
          <div class="status_info">
            <div class="status_text">
              <div v-if="toast.tipsType == 1">Order placed</div>
              <div v-else-if="toast.tipsType == 2">
                <span>Order busted at loss of</span>
                <span class="loss">
                  {{
                    `&nbsp;${
                      Number(toast.income || 0) >= 0 ? "+" : ""
                    }${formatIncome(Number(toast.income || 0))}`
                  }}
                </span>
                <v-img
                  :width="14"
                  cover
                  v-if="toast.coinName == 'RCP'"
                  src="@/assets/images/game/icon_rcp.png"
                ></v-img>
                <v-img
                  :width="14"
                  cover
                  v-else
                  src="@/assets/images/game/icon_roller.png"
                ></v-img>
              </div>
              <div v-else>
                <span v-if="Number(toast.income || 0) >= 0">
                  Order closed at profit of
                </span>
                <span v-else>Order closed at loss of</span>
                <span
                  :class="[Number(toast.income || 0) >= 0 ? 'profit' : 'loss']"
                >
                  {{
                    `&nbsp;${
                      Number(toast.income || 0) >= 0 ? "+" : ""
                    }${formatIncome(Number(toast.income || 0))}`
                  }}
                </span>
                <v-img
                  :width="14"
                  cover
                  v-if="toast.coinName == 'RCP'"
                  src="@/assets/images/game/icon_rcp.png"
                ></v-img>
                <v-img
                  :width="14"
                  cover
                  v-else
                  src="@/assets/images/game/icon_roller.png"
                ></v-img>
              </div>
            </div>
            <div class="status_description">
              <span>
                {{ `Amount: ${formatIncome(toast.amount)}, ` }}
              </span>
              <span>{{
                `Multiplier: x${Number(toast.multiplier).toLocaleString()}, `
              }}</span>
              <span v-if="toast.tipsType == 1">
                {{
                  `Buy Price: ${Number(toast.price || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}`
                }}
              </span>
              <span v-else-if="toast.tipsType == 2">
                {{
                  `Bust Price: ${Number(toast.exitPrice || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}`
                }}
              </span>
              <span v-else>
                {{
                  `Exit Price: ${Number(toast.exitPrice || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}`
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition-group>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useGameStore } from "@/store/game";
import { unitConversion } from "@/utils";

interface ToastMessage {
  id: number; // 索引id
  tipsType: number; // 提示类型 1：买入 2：爆仓 3：收益 4：亏损
  side: string; // 买入类型
  amount: number; // 购买数量
  price: number; // 价格
  multiplier: number; // 倍数
  exitPrice?: number; // 退出价格
  income?: number; // 收益
  ebustPrice?: number; // 爆仓价格，前端计算
  [x: string]: string | number | any;
}

export default defineComponent({
  name: "Toast",
  data() {
    return {
      toasts: [] as Array<ToastMessage>,
      toastId: 0,
    };
  },
  computed: {
    // 当前房间
    gameLevel() {
      const { gameLevel } = useGameStore();
      return gameLevel;
    },
  },
  methods: {
    showToast(event: ToastMessage) {
      const id = this.toastId++;
      this.toasts.unshift({ ...event, index: id });

      // Automatically remove the toast after 3 seconds
      setTimeout(() => {
        this.closeToast(id);
      }, 2000);
    },
    closeToast(id: number) {
      const index = this.toasts.findIndex((toast) => toast.index === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    },
    getToastContainerStyle(index: number) {
      return {
        top: `calc(44% - ${index * 64}px)`, // Adjust top position
        position: "fixed" as "fixed",
        zIndex: "9999", // Ensure it's above other content
      };
    },
    // 格式化收益
    formatIncome(income: number) {
      if (Math.abs(income || 0) < 1000) {
        return Math.floor(income);
      } else {
        return unitConversion(Math.floor(income) || 0);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.toast-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  pointer-events: none; /* Ensure events pass through */
  transition: all 0.5s;
}

.toast-enter-active {
  transition: opacity 0.5s, transform 0.5s;
}

.toast-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.toast-enter,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.order_box {
  min-width: 90%;
  background-color: #161823;
  margin: 0 16px;
  padding: 8px;
  border-radius: 8px;
}

.status_box {
  display: flex;
  align-items: center;

  .v-img {
    flex: none;
    margin-right: 8px;
  }
}

.status_info {
  .status_text {
    font-size: 16px;
    color: white;
    font-weight: bold;
    & > div {
      display: inline-flex;
      align-items: center;

      .v-img {
        flex: none;
        margin-left: 4px;
      }
    }
    .loss {
      color: #ff4949;
    }

    .profit {
      color: #72f238;
    }
  }

  .status_description {
    font-weight: 400;
    font-style: normal;
    font-size: 12px;
    color: #8c90a0;
  }
}

.close-btn {
  position: absolute;
  top: 5px;
  right: 10px;
  border: none;
  background: none;
  cursor: pointer;
  color: #fff;
  opacity: 0.6;
}

.close-btn:hover {
  opacity: 1;
}
</style>
