import { Timeslot } from "@project/domain/timeslots/Timeslot.js"
import { UserInfo } from "@project/domain/users/UserInfo.js"
import { JwtService } from "@project/infra/auth/services/JwtService.js"
import { TimeslotsRepository } from "@project/infra/timeslots/TimeslotsRepository.js"
import { catchAsyncError } from "@tsed/core"
import { DITest, runInContext } from "@tsed/di" // we use DITest to be agnostic with the Serverless/Web platform as much is possible
import { NotFound } from "@tsed/exceptions"
import { deserialize } from "@tsed/json-mapper"
import { PlatformTest } from "@tsed/platform-http/testing"
import { getSpec, SpecTypes } from "@tsed/schema"

import { TimeslotsController } from "./TimeslotsController.js"

async function getControllerFixture() {
  const timeslot = deserialize<Timeslot>(
    {
      id: "uuid",
      label: "Timeslot 1"
    },
    { useAlias: false, type: Timeslot }
  )
  const repository = {
    getAll: vi.fn().mockResolvedValue([timeslot]),
    getById: vi.fn().mockResolvedValue(timeslot),
    save: vi.fn().mockResolvedValue(timeslot),
    create: vi.fn().mockResolvedValue(timeslot)
  }

  const controller = await DITest.invoke<TimeslotsController>(TimeslotsController, [
    {
      token: TimeslotsRepository,
      use: repository
    }
  ])

  const jwtService = DITest.get<JwtService>(JwtService)
  const token = await jwtService.encode({
    user: new UserInfo({
      scopes: ["timeslots"]
    })
  })

  const $ctx = PlatformTest.createRequestContext()

  $ctx.request.headers["authorization"] = "Bearer " + token

  return {
    controller,
    repository,
    timeslot,
    $ctx
  }
}

describe("TimeslotsController", () => {
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

  describe("OAS3", () => {
    it("should generate the expected OpenAPI document", async () => {
      const result = getSpec(TimeslotsController, {
        specType: SpecTypes.OPENAPI
      })

      expect(result).toMatchSnapshot()
    })
  })

  describe("getTimeslots()", () => {
    it("should return the list of timeslots", async () => {
      const { timeslot, $ctx, controller, repository } = await getControllerFixture()

      const result = await runInContext($ctx, () => controller.getTimeslots())

      expect(repository.getAll).toHaveBeenCalledWith()
      expect(result).toEqual([timeslot])
    })
  })

  describe("getTimeslotById()", () => {
    it("should return the timeslot from his given id", async () => {
      const { timeslot, controller, $ctx, repository } = await getControllerFixture()

      const result = await runInContext($ctx, () => controller.getTimeslotById("uuid"))

      expect(repository.getById).toHaveBeenCalledWith("uuid")
      expect(result).toEqual(timeslot)
    })

    it("should throw a not found error when the given id isn't known", async () => {
      const { controller, repository, $ctx } = await getControllerFixture()

      repository.getById.mockResolvedValue(undefined)

      const error = await catchAsyncError<NotFound>(() => runInContext($ctx, () => controller.getTimeslotById("uuid")))

      expect(repository.getById).toHaveBeenCalledWith("uuid")
      expect(error).toBeInstanceOf(NotFound)
      expect(error?.message).toEqual("Timeslot not found")
    })
  })

  describe("createTimeslot()", () => {
    it("should create a new timeslot", async () => {
      const { timeslot, controller, repository, $ctx } = await getControllerFixture()

      const result = await runInContext($ctx, () => controller.createTimeslot(timeslot))

      expect(repository.create).toHaveBeenCalledWith(timeslot)
      expect(result).toEqual(timeslot)
    })
  })

  describe("updateTimeslot()", () => {
    it("should update a timeslot", async () => {
      const { timeslot, controller, $ctx, repository } = await getControllerFixture()

      const result = await runInContext($ctx, () => controller.updateTimeslot(timeslot.id, timeslot))

      expect(repository.save).toHaveBeenCalledWith(timeslot)
      expect(result).toEqual(timeslot)
    })

    it("should throw a not found error when the given id isn't known", async () => {
      const { timeslot, controller, repository, $ctx } = await getControllerFixture()

      repository.getById.mockResolvedValue(undefined)

      const error = await catchAsyncError<NotFound>(() => runInContext($ctx, () => controller.updateTimeslot("uuid", timeslot)))

      expect(repository.getById).toHaveBeenCalledWith(timeslot.id)
      expect(error).toBeInstanceOf(NotFound)
      expect(error?.message).toEqual("Timeslot not found")
    })
  })
})
