import { UserInfo } from "@project/domain/users/UserInfo.js"
import { DIContext, DITest, runInContext } from "@tsed/di"
import { PlatformTest } from "@tsed/platform-http/testing"
import { ServerlessContext } from "@tsed/platform-serverless"
import { beforeEach } from "vitest"

import { AuthContext } from "./AuthContext.js"
import { JwtService } from "./JwtService.js"

describe("AuthContext", () => {
  beforeEach(() =>
    DITest.create({
      envs: {
        JWT_SECRET: "zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI",
        JWT_ISSUER: "https://egain.com",
        JWT_AUDIENCE: "537d714c-d062-45ef-957d-6beac6490233"
      }
    })
  )
  afterEach(() => DITest.reset())
  describe("getUserInfo()", () => {
    describe("when PLATFORM is WWW", () => {
      it("should return user info", async () => {
        const authContext = await DITest.invoke(AuthContext)
        const jwtService = DITest.get<JwtService>(JwtService)
        const token = await jwtService.encode({
          user: new UserInfo({
            scopes: []
          })
        })

        const $ctx = PlatformTest.createRequestContext()
        $ctx.request.headers.authorization = "Bearer " + token

        $ctx.set("user", new UserInfo())

        const result = await runInContext($ctx, () => authContext.getUserInfo())

        expect(result).toBeInstanceOf(UserInfo)
      })
      it("should return undefined if the token is empty", async () => {
        const authContext = await DITest.invoke(AuthContext)

        const $ctx = PlatformTest.createRequestContext()

        $ctx.set("user", new UserInfo())

        const result = await runInContext($ctx, () => authContext.getUserInfo())

        expect(result).toBeUndefined()
      })
    })
    describe("when PLATFORM is CLI", () => {
      it("should return undefined", async () => {
        const authContext = await DITest.invoke(AuthContext)

        const $ctx = new DIContext({
          id: "id",
          platform: "CLI",
          injector: DITest.injector,
          logger: DITest.injector.logger
        })

        const result = await runInContext($ctx, () => authContext.getUserInfo())

        expect(result).toBeUndefined()
      })
    })
    describe("when PLATFORM is SERVERLESS", () => {
      it("should return user info from authorizer", async () => {
        const authContext = await DITest.invoke(AuthContext)

        const $ctx = new ServerlessContext({
          id: "id",
          platform: "SERVERLESS",
          injector: DITest.injector,
          logger: DITest.injector.logger,
          endpoint: {} as never,
          event: {
            headers: {},
            requestContext: {
              accountId: "accountId",
              requestId: "",
              authorizer: {
                user: new UserInfo()
              }
            }
          } as never,
          context: {} as never
        })

        const result = await runInContext($ctx, () => authContext.getUserInfo())

        expect(result).toBeInstanceOf(UserInfo)
      })
      it("should return user info from header authorization", async () => {
        const authContext = await DITest.invoke(AuthContext)
        const jwtService = DITest.get<JwtService>(JwtService)

        const token = await jwtService.encode({
          user: new UserInfo({
            scopes: []
          })
        })

        const $ctx = new ServerlessContext({
          id: "id",
          platform: "SERVERLESS",
          injector: DITest.injector,
          logger: DITest.injector.logger,
          endpoint: {} as never,
          event: {
            headers: {
              authorization: `Bearer ${token}`
            },
            requestContext: {
              accountId: "accountId",
              requestId: "",
              authorizer: {}
            }
          } as never,
          context: {} as never
        })

        const result = await runInContext($ctx, () => authContext.getUserInfo())

        expect(result).toBeInstanceOf(UserInfo)
      })
      it("should return undefined if auhtorizer / header authorization are missing", async () => {
        const authContext = await DITest.invoke(AuthContext)

        const $ctx = new ServerlessContext({
          id: "id",
          platform: "SERVERLESS",
          injector: DITest.injector,
          logger: DITest.injector.logger,
          endpoint: {} as never,
          event: {
            headers: {},
            requestContext: {
              accountId: "accountId",
              requestId: ""
            }
          } as never,
          context: {} as never
        })

        const result = await runInContext($ctx, () => authContext.getUserInfo())

        expect(result).toBeUndefined()
      })
    })
  })
})
