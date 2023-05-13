const defaultConfig = require("../../jest.config")

module.exports = {
  ...defaultConfig,
  testEnvironment: "jsdom",
}
