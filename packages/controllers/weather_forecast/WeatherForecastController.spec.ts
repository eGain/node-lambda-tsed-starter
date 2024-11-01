import { WeatherForecastClient } from "@project/infra/weather_forecast/WeatherForecastClient.js"
import { DITest } from "@tsed/di"
import { PlatformTest } from "@tsed/platform-http/testing"

import { WeatherForecastController } from "./WeatherForecastController.js"

async function getControllerFixture() {
  const weatherForecastClient = {
    getWeeklyForecast: vi.fn().mockResolvedValue([])
  }
  const controller = await PlatformTest.invoke<WeatherForecastController>(WeatherForecastController, [
    {
      token: WeatherForecastClient,
      use: weatherForecastClient
    }
  ])

  return {
    controller,
    weatherForecastClient
  }
}

describe("WeatherForecastController", () => {
  beforeEach(() => DITest.create())
  afterEach(() => DITest.reset())
  it("getWeaklyForecast()", async () => {
    const { controller, weatherForecastClient } = await getControllerFixture()

    const result = await controller.getWeaklyForecast("PARIS")

    expect(weatherForecastClient.getWeeklyForecast).toHaveBeenCalledWith("PARIS")
    expect(result).toEqual([])
  })
})
