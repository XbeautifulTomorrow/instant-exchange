<template>
  <div>
    <v-app-bar
      elevation="2"
      style="padding: 0 8px"
      app
      fixed
      dark
      color="#fff"
      density="compact"
    >
      <template v-slot:prepend>
        <div class="app_title">Swap</div>
      </template>
      <template v-slot:append>
        <div class="connect_info" v-if="isConnect">
          <div class="connect_address">
            <v-img
              :width="20"
              cover
              src="@/assets/images/icon_wallet.svg"
            ></v-img>
            <span>{{ formatAddr(walletAddr) }}</span>
          </div>
          <div class="disconnect_btn" @click="handleDisconnect()">
            <v-img
              :width="16"
              cover
              src="@/assets/images/icon_disconnect.svg"
            ></v-img>
          </div>
        </div>
      </template>
    </v-app-bar>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useUserStore } from "@/store/user.js";

export default defineComponent({
  data() {
    return {
      showMenu: false,
      isTab: true,
      NavList: ["/", "/earn", "/frens", "/wallet"],
    };
  },
  created() {},
  computed: {
    isLogin() {
      const { isLogin } = useUserStore();
      return isLogin;
    },
    isConnect() {
      const { isConnect } = useUserStore();
      return isConnect;
    },
    walletAddr() {
      const { walletAddr } = useUserStore();
      return walletAddr;
    },
    tonConnect: {
      get() {
        const { tonConnect } = useUserStore();
        return tonConnect;
      },
      set(val: boolean) {
        const { setTonConnect } = useUserStore();
        setTonConnect(val);
      },
    },
  },
  methods: {
    goBack() {
      this.$router.go(-1); // 返回上一页
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
    // 格式化地址
    formatAddr(event: string) {
      if (!event) return event;
      var reg = /^(\S{8})\S+(\S{6})$/;
      return event.replace(reg, "$1...$2");
    },
  },
});
</script>
<style lang="scss" scoped>
.back {
  margin-right: 8px;
}

.app_title {
  font-size: 24px;
  font-weight: 700;
}

.connect_info {
  display: flex;
  align-items: center;
  justify-content: center;

  .connect_address {
    display: flex;
    align-items: center;
    font-weight: 700;
    font-style: normal;
    color: #fff;
    font-size: 12px;
    background-color: rgba(0, 152, 235, 1);
    border-radius: 4px;
    padding: 2px 4px;
    margin-right: 4px;

    .v-img {
      flex: none;
      margin-right: 4px;
    }
  }

  .disconnect_btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(6, 2, 2, 1);
    border-radius: 4px;

    .v-img {
      flex: none;
    }
  }
}
</style>