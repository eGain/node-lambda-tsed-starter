import { Default, Example, Required } from "@tsed/schema"

export class GreetingRequest {
  @Required()
  @Example("John")
  name: string

  @Required(false)
  @Default(2)
  count: number = 2

  @Required(false)
  additionalMsg: string = ""
}
