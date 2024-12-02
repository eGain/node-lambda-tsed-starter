import { Timeslot } from "@project/domain/timeslots/Timeslot.js"
import { Authorize } from "@project/infra/auth/decorators/Authorize.js"
import { TimeslotsRepository } from "@project/infra/timeslots/TimeslotsRepository.js"
import { Controller, Inject } from "@tsed/di"
import { NotFound } from "@tsed/exceptions"
import { BodyParams, PathParams } from "@tsed/platform-params"
import { Delete, Format, Get, Groups, JsonFormatTypes, Post, Put, Returns } from "@tsed/schema"

@Controller("/timeslots")
export class TimeslotsController {
  @Inject(TimeslotsRepository)
  protected repository: TimeslotsRepository

  @Get("/")
  @(Returns(200, Array).Of(Timeslot))
  @Authorize({ scopes: ["timeslots"] })
  async getTimeslots() {
    return this.repository.getAll()
  }

  @Get("/:id")
  @Returns(200, Timeslot)
  @(Returns(404).Description("Timeslot not found"))
  @Authorize({ scopes: ["timeslots"] })
  async getTimeslotById(@PathParams("id") @Format(JsonFormatTypes.UUID) id: string) {
    const result = await this.repository.getById(id)

    if (!result) {
      throw new NotFound("Timeslot not found")
    }

    return result
  }

  @Post("/")
  @Returns(201, Timeslot)
  @Authorize({ scopes: ["timeslots"] })
  async createTimeslot(@BodyParams() @Groups("create") payload: Timeslot) {
    return this.repository.create(payload)
  }

  @Put("/:id")
  @Returns(200, Timeslot)
  @(Returns(404).Description("Timeslot not found"))
  @Authorize({ scopes: ["timeslots"] })
  async updateTimeslot(@PathParams("id") @Format(JsonFormatTypes.UUID) id: string, @BodyParams() @Groups("update") payload: Timeslot) {
    // check if the timeslot exists
    await this.getTimeslotById(id)

    payload.id = id

    return this.repository.save(payload)
  }

  @Delete("/:id")
  @Returns(204)
  @(Returns(404).Description("Timeslot not found"))
  @Authorize({ scopes: ["timeslots"] })
  async deleteTimeslot(@PathParams("id") @Format(JsonFormatTypes.UUID) id: string) {
    // check if the timeslot exists
    await this.repository.getById(id)
    await this.repository.delete(id)
  }
}
