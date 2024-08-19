// import { createPinia, setMapStoreSuffix } from "pinia";
import { createPinia } from "pinia";
import piniaPluginPersist from "pinia-plugin-persist";

// 默认情况下，Pinia 会在每个 store 的 id 后面加上 "Store" 的后缀
// // 完全删除后缀：this.user, this.cart
// setMapStoreSuffix("");
// // this.user_store, this.cart_store (没关系，我不会批评你的)
// setMapStoreSuffix("_store");
const store = createPinia();
store.use(piniaPluginPersist);

export default store;