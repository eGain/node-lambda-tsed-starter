import { Example, Required } from "@tsed/schema"

export class GreetingRequest {
  @Required()
  @Example("John")
  name: string

  @Required(false)
  count: number = 1

  @Required(false)
  additionalMsg: string = ""
}
