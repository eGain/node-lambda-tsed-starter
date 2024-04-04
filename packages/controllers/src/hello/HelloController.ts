import { GreetingRequest } from "@project/domain/hello/GreetingRequest.js"
import { HelloService } from "@project/service/hello/HelloService.js"
import { Controller, Inject } from "@tsed/di"
import { BodyParams, QueryParams } from "@tsed/platform-params"
import { Get, Post, Returns } from "@tsed/schema"

@Controller("/hello")
export class HelloController {
  @Inject()
  private helloService: HelloService

  @Get("/")
  @Returns(200, String)
  get(@QueryParams("name") name: string) {
    return `Hello ${name}!`
  }

  @Post("/")
  @Returns(200, Array<string>)
  post(@BodyParams() payload: GreetingRequest) {
    return this.helloService.handleGreetRequest(payload)
  }
}
