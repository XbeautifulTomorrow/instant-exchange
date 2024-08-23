const config = {
  dev: {
    api: "https://test2.xlab.red:6501/",
  },
  test: {
    api: "https://test2.xlab.red:6501/",
  },
  prod: {
    api: "/",
  },
};

export default {
  ENV: import.meta.env.NODE_ENV,
  ...config[import.meta.env.VITE_SERVER_CONFIG as keyof typeof config],
};