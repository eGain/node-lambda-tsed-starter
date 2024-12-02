import { PlatformTest } from "@tsed/platform-http/testing"
import SuperTest from "supertest"

import { Server } from "./Server.js"

describe("Server", () => {
  beforeEach(PlatformTest.bootstrap(Server))
  afterEach(PlatformTest.reset)

  it("should call GET /rest", async () => {
    const request = SuperTest(PlatformTest.callback())
    const response = await request.get("/rest").expect(404)

    expect(response.body).toEqual({
      errors: [],
      message: 'Resource "/rest" not found',
      name: "NOT_FOUND",
      status: 404
    })
  })

  it("should generate swagger.json", async () => {
    const request = SuperTest(PlatformTest.callback())
    const response = await request.get("/doc/swagger.json").expect(200)

    expect(response.body).toMatchSnapshot()
  })
})
