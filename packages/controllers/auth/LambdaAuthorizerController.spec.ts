import { UserInfo } from "@project/domain/users/UserInfo.js"
import { JwtService } from "@project/infra/auth/services/JwtService.js"
import { DITest } from "@tsed/di"
import { PlatformTest } from "@tsed/platform-http/testing"
import { ServerlessContext, ServerlessResponse } from "@tsed/platform-serverless"

import { AuthorizeServerlessContext, LambdaAuthorizerController } from "./LambdaAuthorizerController.js"

async function getControllerFixture({ scopes }: { scopes: string[] }) {
  const controller = await PlatformTest.invoke<LambdaAuthorizerController>(LambdaAuthorizerController, [])
  const user = new UserInfo({
    _id: "123",
    email: "",
    scopes
  })

  const jwtService = PlatformTest.get<JwtService>(JwtService)
  const authorizationToken = await jwtService.encode({ user })

  const $ctx = new ServerlessContext({
    id: "id",
    injector: DITest.injector,
    logger: DITest.injector.logger,
    event: {
      headers: {},
      authorizationToken
    } as never,
    context: {} as never,
    endpoint: {} as never
  })

  return {
    user,
    controller,
    $ctx
  }
}

describe("LambdaAuthorizerController", () => {
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

  describe("authorizer()", () => {
    it("should allow user to consume api", async () => {
      const { controller, $ctx } = await getControllerFixture({
        scopes: ["api", "timeslots"]
      })

      const result = await controller.authorizer($ctx as AuthorizeServerlessContext)

      expect(result).toEqual({
        context: {
          user: {
            email: "",
            emailVerified: false,
            id: "123",
            scopes: ["api", "timeslots"]
          }
        },
        principalId: "me"
      })
    })
    it("should reject user to consume timeslots", async () => {
      const { controller, $ctx } = await getControllerFixture({
        scopes: ["api"]
      })

      const result = await controller.authorizer($ctx as AuthorizeServerlessContext)

      expect(result).toEqual({
        context: {
          user: undefined
        },
        principalId: "me"
      })
    })
    it("should reject user to consume api", async () => {
      const { controller, $ctx } = await getControllerFixture({
        scopes: []
      })

      const result = (await controller.authorizer($ctx as AuthorizeServerlessContext)) as unknown as ServerlessResponse

      expect(result.statusCode).toEqual(401)
      expect(result.getBody()).toEqual({
        context: {
          user: undefined
        },
        principalId: "me"
      })
    })
  })
})
