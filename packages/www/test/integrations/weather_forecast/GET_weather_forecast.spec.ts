import { PlatformTest } from "@tsed/platform-http/testing"
import SuperTest from "supertest"
import { afterAll, beforeAll } from "vitest"

import { Server } from "../../../src/Server.js"
import { getMockServerUrl } from "../utils/mockServerTestContainer.js"

describe("WeatherForecast", () => {
  beforeAll(async () => {
    await PlatformTest.bootstrap(Server, {
      logger: {
        // level: "info"
      },
      envs: {
        WEATHER_FORECAST_API_URL: `${await getMockServerUrl()}/owf`,
        WEATHER_FORECAST_API_KEY: "an-api-key"
      }
    })()
  })
  afterAll(async () => PlatformTest.reset())

  describe("GET /weather_forecast", () => {
    it("should call the weather forecast endpoint", async () => {
      const request = SuperTest(PlatformTest.callback())
      const response = await request.get("/weather_forecast").query({ city: "Paris" }).expect(200)

      expect(response.body).toMatchInlineSnapshot(`
        [
          {
            "date": "2024-05-23T00:00:00.000Z",
            "id": "20240523",
            "temperature": {
              "afternoon": 17.92,
              "evening": 19.92,
              "max": 20.69,
              "min": 14.07,
              "morning": 15.26,
              "night": 14.96,
            },
            "unit": "CELSIUS",
            "weather": {
              "code": "RAIN",
              "description": "lluvia moderada",
            },
          },
        ]
      `)
    })
    // eslint-disable-next-line vitest/expect-expect
    it("should get not found if the city is not in the database", async () => {
      const request = SuperTest(PlatformTest.callback())
      await request.get("/weather_forecast").query({ city: "Foo" }).expect(404)
    })
    // eslint-disable-next-line vitest/expect-expect
    it("should get bad request if city is less than 2 characters", async () => {
      const request = SuperTest(PlatformTest.callback())
      await request.get("/weather_forecast").query({ city: "F" }).expect(400)
    })
    // eslint-disable-next-line vitest/expect-expect
    it("should get bad request if city is less more 10 characters", async () => {
      const request = SuperTest(PlatformTest.callback())
      await request.get("/weather_forecast").query({ city: "Ffhsajkfhsajkfhjsakdjflda" }).expect(400)
    })
  })
})
