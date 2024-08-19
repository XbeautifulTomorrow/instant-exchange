<template>
  <div class="down_wrapper">
    <slot
      v-bind="{
        d: days,
        h: hours,
        m: mins,
        s: seconds,
        dd: `00${days}`.slice(-2),
        hh: `00${hours}`.slice(-2),
        mm: `00${mins}`.slice(-2),
        ss: `00${seconds}`.slice(-2),
      }"
    ></slot>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useUserStore } from "@/store/user";
export default defineComponent({
  name: "countDown",
  data: () => ({
    days: "00" as number | string | any,
    hours: "00" as number | string | any,
    mins: "00" as number | string | any,
    seconds: "00" as number | string | any,
    timer: null as number | any,
    curTime: 0,
  }),
  props: {
    time: {
      type: [Number, String],
      default: 0,
    },
    refreshCounter: {
      type: [Number, String],
      default: 0,
    },
    isMiniSecond: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    duration() {
      const { currentTime } = useUserStore();
      if (currentTime) {
        const endstamp = new Date(this.time).getTime();
        let end = String(endstamp).length >= 13 ? +endstamp : +endstamp * 1000;
        end -= new Date(currentTime).getTime();
        return end;
      }
      const timestamp = new Date(this.time).getTime();
      const time = this.isMiniSecond
        ? Math.round(+timestamp / 1000)
        : Math.round(+timestamp);
      return time;
    },
  },
  mounted() {
    this.countDown();
  },
  watch: {
    duration() {
      this.countDown();
    },
    refreshCounter() {
      this.countDown();
    },
  },
  methods: {
    durationFormatter(diff: number) {
      // 按照传入的格式生成一个simpledateformate对象
      let nd = 1000 * 24 * 60 * 60; // 一天的毫秒数
      let nh = 1000 * 60 * 60; // 一小时的毫秒数
      let nm = 1000 * 60; // 一分钟的毫秒数
      let ns = 1000; // 一秒钟的毫秒数;

      let dd = diff / nd; // 计算差多少天
      // eslint-disable-next-line no-unused-vars
      let hh = (diff % nd) / nh; // 计算差多少小时
      // eslint-disable-next-line no-unused-vars
      let mm = ((diff % nd) % nh) / nm; // 计算差多少分钟
      // eslint-disable-next-line no-unused-vars
      let ss = (((diff % nd) % nh) % nm) / ns; // 计算差多少秒//输出结果
      return { dd, hh, mm, ss };
    },
    countDown() {
      if (!this.time) return;
      this.curTime = new Date().getTime();
      this.getTime(this.duration);
    },
    getTime(time: number) {
      this.timer && clearTimeout(this.timer);
      if (time <= 1000) {
        // 计时结束
        this.seconds = "00";
        this.$emit("onEnd");
        return;
      }
      // eslint-disable-next-line object-curly-newline
      const { dd, hh, mm, ss } = this.durationFormatter(time);
      this.days = Math.floor(dd) || 0;
      this.hours = Math.floor(hh) || 0;
      this.mins = Math.floor(mm) || 0;
      this.seconds = Math.floor(ss) || 0;
      this.timer = setTimeout(() => {
        const now = new Date().getTime();
        const diffTime = Math.floor(now - this.curTime);
        const step = diffTime > 1000 ? diffTime : 1000; // 页面退到后台的时候不会计时，对比时间差，大于1s的重置倒计时
        this.curTime = now;
        this.getTime(time - step);
        // 将剩余秒数返回
        this.$emit("onCountDown", time);
      }, 1000);
    },
  },
  beforeUnmount() {
    this.timer && clearTimeout(this.timer);
  },
});
</script>
<style lang='scss' scoped>
.down_wrapper {
  width: auto;
  display: inline-flex;
  align-items: center;
}

span {
  display: inline-block;
}

.section {
  position: relative;
}
</style>