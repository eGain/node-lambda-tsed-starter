import { $log } from "@tsed/logger"
import { PlatformExpress } from "@tsed/platform-express"

import { Server } from "./Server.js"

async function bootstrap() {
  try {
    const platform = await PlatformExpress.bootstrap(Server)
    await platform.listen()

    process.on("SIGINT", () => {
      platform.stop()
    })
  } catch (error) {
    $log.error({
      event: "SERVER_BOOTSTRAP_ERROR",
      message: error.message,
      stack: error.stack
    })
  }
}

bootstrap()
