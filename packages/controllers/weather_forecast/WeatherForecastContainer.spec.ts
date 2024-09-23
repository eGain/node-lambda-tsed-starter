import {WeatherForecastClient} from "@project/infra/weather_forecast/WeatherForecastClient.js"
import {PlatformTest} from "@tsed/common"
import {DITest} from "@tsed/di"

import {WeatherForecastController} from "./WeatherForecastController.js"
import {envs} from "@project/commands/config/envs"
import {afterAll, beforeAll} from "vitest"
import {
    getMockServerUrl,
    startMockServer,
    stopMockServer
} from "@project/www/test/integrations/utils/mockServerTestContainer"

async function getControllerFixture() {
    await PlatformTest.create({envs})
    const weatherForecastClient = await PlatformTest.invoke<WeatherForecastClient>(WeatherForecastClient, [])
    return await PlatformTest.invoke<WeatherForecastController>(WeatherForecastController, [
        {
            token: WeatherForecastClient,
            use: weatherForecastClient
        }
    ])
}

describe("WeatherForecastControllerWithTestcontainer", () => {
    beforeAll(async () => {
        await startMockServer()
        envs.WEATHER_FORECAST_API_URL = `${(getMockServerUrl())}/owf`
        envs.WEATHER_FORECAST_API_KEY = "an-api-key"
    }, 60000)
    afterAll(async () => {
        await stopMockServer()
    })
    beforeEach(() => DITest.create())
    afterEach(() => DITest.reset())
    it("getWeaklyForecast()", async () => {
        const controller = await getControllerFixture()

        const result = await controller.getWeaklyForecast("PARIS")
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
