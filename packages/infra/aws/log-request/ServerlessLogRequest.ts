import { cleanObject } from "@tsed/core"
import { Constant, Inject, Module } from "@tsed/di"
import { Logger } from "@tsed/logger"
import { ServerlessContext } from "@tsed/platform-serverless"

@Module()
export class ServerlessLogRequest {
  @Constant("logger.requestFields", ["reqId", "method", "url", "duration", "route"])
  protected requestFields: string[]

  @Constant("logger.logRequest", true)
  protected logRequest: boolean

  @Constant("logger.logStart", true)
  protected logStart: boolean

  @Constant("logger.logEnd", true)
  protected logEnd: boolean

  @Constant("logger.level")
  protected logLevel: string

  @Inject()
  protected logger: Logger

  $onInit() {
    this.logger.appenders.set("stdout", {
      type: "stdout",
      levels: ["info", "debug"],
      layout: {
        type: "json"
      }
    })

    this.logger.appenders.set("stderr", {
      levels: ["trace", "fatal", "error", "warn"],
      type: "stderr",
      layout: {
        type: "json"
      }
    })
  }

  $onRequest($ctx: ServerlessContext) {
    this.configureRequest($ctx)
  }

  $onResponse($ctx: ServerlessContext) {
    const { logRequest, logEnd, logLevel } = this

    if (logEnd) {
      if ($ctx.response.statusCode >= 400) {
        $ctx.logger.error({
          event: "request.end",
          status: $ctx.response.statusCode,
          status_code: String($ctx.response.statusCode),
          state: "KO",
          ...cleanObject({
            error_name: $ctx.error?.name || $ctx.error?.code,
            error_message: $ctx.error?.message,
            error_errors: $ctx.error?.errors,
            error_stack: $ctx.error?.stack,
            error_body: $ctx.error?.body,
            error_headers: $ctx.error?.headers
          })
        })
      } else {
        if (logLevel === "debug") {
          $ctx.logger.debug({
            event: "request.end",
            status: $ctx.response.statusCode,
            status_code: String($ctx.response.statusCode),
            data: $ctx.data,
            state: "OK"
          })
        } else if (logRequest) {
          $ctx.logger.info({
            event: "request.end",
            status: $ctx.response.statusCode,
            status_code: String($ctx.response.statusCode),
            state: "OK"
          })
        }
      }
    }

    $ctx.logger.flush()
  }

  /**
   * Attach all information that will be necessary to log the request. Attach a new `request.log` object.
   */
  protected configureRequest($ctx: ServerlessContext) {
    $ctx.logger.alterLog((obj: Record<string, unknown>, level, withRequest) => {
      switch (level) {
        case "info":
          return { ...this.minimalRequestPicker($ctx), ...obj }
        case "debug":
          return withRequest ? { ...this.requestToObject($ctx), ...obj } : obj
        default:
          return { ...this.requestToObject($ctx), ...obj }
      }
    })
  }

  /**
   * Return complete request info.
   * @returns {Object}
   * @param ctx
   */
  protected requestToObject(ctx: ServerlessContext): Record<string, unknown> {
    const { request } = ctx

    return {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      query: request.query,
      params: request.params,
      aws_event: ctx.event,
      aws_context: ctx.context
    }
  }

  /**
   * Return a filtered request from global configuration.
   * @returns {Object}
   * @param ctx
   */
  protected minimalRequestPicker(ctx: ServerlessContext): Record<string, unknown> {
    const { requestFields } = this
    const info = this.requestToObject(ctx)

    return requestFields!.reduce((acc: Record<string, unknown>, key: string) => {
      acc[key] = info[key]

      return acc
    }, {})
  }
}
