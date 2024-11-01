import { DIContext, Inject, Injectable, InjectContext } from "@tsed/di"
import type { PlatformContext } from "@tsed/platform-http"
import type { ServerlessContext } from "@tsed/platform-serverless"

import { JwtService } from "./JwtService.js"

/**
 * AuthContext is a special service that resolve the user information from the request context and depending
 * on the current runtime platform.
 */
@Injectable()
export class AuthContext {
  @InjectContext()
  protected $ctx?: DIContext

  @Inject()
  protected jwtService: JwtService

  async getUserInfo() {
    switch (this?.$ctx?.PLATFORM) {
      case "WWW":
        return this.getUserInfoFromAuthorizationHeader()
      case "CLI":
        return
      case "SERVERLESS":
        return this.getUserInfoFromAuthorizer()
    }
  }

  private async getUserInfoFromAuthorizationHeader() {
    const $ctx = this.$ctx as PlatformContext

    const auth = $ctx.request.get("authorization")

    this.$ctx?.logger.debug({
      event: "AUTH_CONTEXT_GET_USER_INFO_FROM_AUTHORIZATION_HEADER",
      auth
    })

    if (auth) {
      const {
        payload: { user }
      } = await this.jwtService.decode(auth.split(" ")[1])

      return user
    }

    return undefined
  }

  private getUserInfoFromAuthorizer() {
    const $ctx = this.$ctx as ServerlessContext

    $ctx.logger.debug({
      event: "AUTH_CONTEXT_GET_USER_INFO_FROM_AUTHORIZER",
      authorizer: $ctx.event.requestContext.authorizer
    })

    if ($ctx.event.requestContext.authorizer?.user) {
      // decoded from the lambda authorizer
      return $ctx.event.requestContext.authorizer.user
    }

    // fallback to the authorization header
    return this.getUserInfoFromAuthorizationHeader()
  }
}
