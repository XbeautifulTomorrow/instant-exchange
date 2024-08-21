<template>
  <div class="slippage_wrapper">
    <v-dialog
      v-model="showSlippage"
      width="auto"
      transition="dialog-bottom-transition"
    >
      <div class="dialog_box">
        <div class="close_btn" @click="handleReady()">
          <v-img :width="20" cover src="@/assets/images/icon_close.svg"></v-img>
        </div>
        <div class="slippage_title">Slippage Setting</div>
        <div class="slippage_hint">
          Setting a high slippage tolerance can help transactions succeed, but
          you may not get such a good price. Use with caution.
        </div>
        <div class="slippage_input">
          <div class="input_item" @click="active = 0">0.3%</div>
          <div class="input_item" @click="active = 1">1%</div>
          <div class="input_item" @click="active = 2">2%</div>
          <div class="input_item" @click="active = 3">5%</div>
          <v-text-field
            class="input_item"
            v-model="slippageNum"
            base-color="#fff"
            bg-color="rgba(0,0,0,0)"
            color="#fff"
            variant="plain"
            hide-details="auto"
            placeholder="Custom"
            @focus="active = 4"
            @input="handleInput"
            reverse
          ></v-text-field>
          <div
            class="input_slider"
            :style="{ left: `calc(${20 * active}% + 4px)` }"
          ></div>
        </div>
        <div class="confirm_btn" @click="handleConfirm()">Confirm</div>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useMessageStore } from "@/store/message.js";
import { isEmpty } from "../../utils/index";
import bigNumber from "bignumber.js";

export default defineComponent({
  data() {
    return {
      active: 3,
      slippageNum: null as number | any,
    };
  },
  computed: {
    showSlippage: {
      get() {
        const { showSlippage } = useMessageStore();
        return showSlippage;
      },
      set(val: boolean) {
        const { setShowSlippage } = useMessageStore();

        if (!val) {
          this.active = 3;
          this.slippageNum = null;
        }

        setShowSlippage(val);
      },
    },
  },
  methods: {
    handleReady() {
      this.showSlippage = false;
    },
    handleInput(event: any) {
      let {
        target: { _value },
      } = event;

      if (!isEmpty(_value) && Number(_value) <= 0) return;

      if (Number(_value) < 0.3) {
        const { setMessageText } = useMessageStore();
        setMessageText("Slippage cannot be less than 0.3%");
        this.slippageNum = 0.3;
      } else if (Number(_value) > 50) {
        const { setMessageText } = useMessageStore();
        setMessageText("Slippage cannot be less than 50%");
        this.slippageNum = 50;
      }
    },
    handleConfirm() {
      const { active, slippageNum } = this;
      if (active == 4) {
        this.$emit(
          "setSlippage",
          new bigNumber(slippageNum).dividedBy(100).toNumber().toFixed(4)
        );
      } else if (active == 0) {
        this.$emit("setSlippage", 0.003);
      } else if (active == 1) {
        this.$emit("setSlippage", 0.01);
      } else if (active == 2) {
        this.$emit("setSlippage", 0.02);
      } else if (active == 3) {
        this.$emit("setSlippage", 0.05);
      }

      this.showSlippage = false;
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

  .slippage_title {
    color: #000;
    font-size: 24px;
    font-style: normal;
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
  cursor: pointer;
}

.slippage_input {
  width: 100%;
  display: flex;
  align-items: center;
  background: inherit;
  background-color: #f6f6f6;
  border-radius: 8px;
  color: #000;
  position: relative;
  padding: 12px 4px;
  margin-top: 14px;

  .input_item {
    flex: 1;
    min-width: 20%;
    padding: 0 4px;
    box-sizing: border-box !important;
    text-align: center;
    font-size: 14px;
    z-index: 2;
    cursor: pointer;
  }

  .input_slider {
    width: calc(20% - 8px);
    left: 4px;
    height: calc(100% - 8px);
    border-radius: 8px;
    position: absolute;
    background-color: white;
    z-index: 1;
  }

  :deep(.v-field__input) {
    font-size: 14px;
    padding: 0;
    min-height: 0;
    line-height: 1.2;
    font-weight: bold;
    text-align: center;

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
  padding: 10px 0;
  cursor: pointer;
}
</style>