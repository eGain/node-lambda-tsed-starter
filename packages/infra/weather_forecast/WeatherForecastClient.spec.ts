import { PlatformTest } from "@tsed/platform-http/testing"

import weatherForecastFixture from "./__fixtures__/weekly_weather_forecast.json" assert { type: "json" }
import { WeatherForecastClient } from "./WeatherForecastClient.js"

async function getFixture({ response }: { response: { data?: unknown; headers?: Record<string, string> } }) {
  const client = await PlatformTest.invoke<WeatherForecastClient>(WeatherForecastClient)

  vi.spyOn(client, "raw").mockReturnValue(response as never)

  return { client }
}

describe("WeatherForecastClient", () => {
  beforeEach(() => PlatformTest.create())
  afterEach(() => PlatformTest.reset())

  describe("getWeeklyForecast()", () => {
    it("should call Weather forecast endpoint", async () => {
      const { client } = await getFixture({
        response: {
          data: weatherForecastFixture
        }
      })

      const result = await client.getWeeklyForecast("PARIS")

      expect(client.raw).toHaveBeenCalledWith({
        url: "/weather_forecast/weekly",
        method: "GET",
        params: {
          city: "PARIS"
        }
      })
      expect(result).toMatchInlineSnapshot(`
        [
          WeatherForecast {
            "date": 2024-05-23T00:00:00.000Z,
            "id": "20240523",
            "temperature": Temperature {
              "afternoon": 17.92,
              "evening": 19.92,
              "max": 20.69,
              "min": 14.07,
              "morning": 15.26,
              "night": 14.96,
            },
            "unit": "CELSIUS",
            "weather": Weather {
              "code": "RAIN",
              "description": "lluvia moderada",
            },
          },
        ]
      `)
    })
  })
})
