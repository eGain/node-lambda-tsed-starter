import { GreetingRequest } from "@project/domain/hello/GreetingRequest.js" // use absolute import to optimize the bundle tree shaking
import { Injectable } from "@tsed/di"

@Injectable()
export class HelloService {
  handleGreetRequest(greetingRequest: GreetingRequest) {
    const result = []
    for (let i = 0; i < greetingRequest.count; i++) {
      result.push(`Hello ${greetingRequest.name}!`)
    }
    if (greetingRequest.additionalMsg) {
      result.push(greetingRequest.additionalMsg)
    }
    return result
  }
}
