<template>
  <v-app class="main">
    <TopToolbar></TopToolbar>
    <v-main>
      <router-view></router-view>
    </v-main>
    <v-snackbar v-model="showMessage" :timeout="3000">
      {{ messageText }}
      <template v-slot:actions>
        <v-btn color="pink" variant="text" @click="closeMessage()">
          Close
        </v-btn>
      </template>
    </v-snackbar>
    <v-dialog v-model="showLoading" width="auto" persistent>
      <div class="loading_box">
        <v-progress-circular
          color="#fff"
          indeterminate
          size="40"
          bg-color="rgba(255, 255, 255, 0)"
          width="4"
        ></v-progress-circular>
        <span class="loading_text">Loading</span>
      </div>
    </v-dialog>
  </v-app>
</template>

<script lang="ts">
import TopToolbar from "@/components/TopToolbar.vue";
import { useMessageStore } from "@/store/message.js";

import { defineComponent } from "vue";
export default defineComponent({
  data() {
    return {};
  },
  components: {
    TopToolbar,
  },
  computed: {
    showMessage: {
      get() {
        const { showMessage } = useMessageStore();
        return showMessage;
      },
      set(val: boolean) {
        const { setShowMessage } = useMessageStore();
        setShowMessage(val);
      },
    },
    messageText() {
      const { messageText } = useMessageStore();
      return messageText;
    },
    showLoading() {
      const { showLoading } = useMessageStore();
      return showLoading;
    },
  },
  methods: {
    // 关闭消息
    closeMessage() {
      const { setShowMessage } = useMessageStore();
      setShowMessage(false);
    },
  },
});
</script>
<style lang="scss" scoped>
@import "@/assets/css/normalize.css";

.main {
  background-color: white;
}

.loading_box {
  width: 120px;
  height: 120px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .loading_text {
    margin-top: 8px;
    font-size: 16px;
    color: #fff;
  }
}
</style>
<style>
/* 谷歌，元素隐藏必须设置宽度  不然无效 */
html::-webkit-scrollbar {
  display: none;
  width: 0px;
  height: auto;
}

/* /兼容火狐/ */
html {
  scrollbar-width: none;
}

/* / 兼容IE10+ */
html {
  -ms-overflow-style: none;
}

.s-enter-active,
.s-enter-to {
  z-index: 3000 !important;
}
</style>
<style>
/* 针对Chrome, Edge等浏览器 */
::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none; /* 标准属性 */
  margin: 0;
}

/* 针对Firefox浏览器 */
input[type="number"] {
  -moz-appearance: textfield; /* Firefox 兼容 */
  appearance: textfield; /* 标准属性 */
}
</style>
