const testytesterson = require("testytesterson");

let name = process.env.NODE_NAME || testytesterson.shortId();

module.exports = {
    nodeEnv: process.env.NODE_ENV || "development",
    nodeType: process.env.NODE_TYPE || "api",
    nodeName: name,
    port: parseInt(process.env.PORT || "43001"),
    redisUrl: process.env.REDIS_URL || `redis://localhost:6379`,
    cookieSecret: process.env.COOKIE_SECRET || '7f7fbfe2-01e1-4fba-b8a4-7c20a0fd396a',
    build: process.env.BUILD || "local",
    deployColor: process.env.DEPLOY_COLOR || "blue",
    discordWebhook: process.env.DISCORD_WEBHOOK,
    ciEnabled: process.env.CI_ENABLED != null && process.env.CI_ENABLED !== "false"  || false,
}