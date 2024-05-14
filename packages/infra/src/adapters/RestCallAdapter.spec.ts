import { mockServerClient } from "mockserver-client"
import { GenericContainer, Wait } from "testcontainers"
import { StartedTestContainer } from "testcontainers/build/test-container"

import { RestCallAdapter } from "./RestCallAdapter"

describe("RestCallAdapter", () => {
  let restCallAdapter: RestCallAdapter | null = null
  let mockServerContainer: StartedTestContainer | null = null
  let mockServerPort: number = -1

  beforeAll(async () => {
    mockServerContainer = await createMockServerContainer()
    mockServerPort = mockServerContainer.getMappedPort(1080)
    await createMockServerExpectations(mockServerContainer)
    restCallAdapter = new RestCallAdapter(`http://localhost:${mockServerPort}`)
  }, 10000)

  afterAll(async () => {
    if (mockServerContainer) {
      await mockServerContainer.stop()
    }
  })

  test("mockserver container should be running", async () => {
    expect(mockServerContainer).not.toBeNull()
    expect(mockServerPort).toBeDefined()
  })
  test("should create instance successfully", () => {
    expect(restCallAdapter).toBeInstanceOf(RestCallAdapter)
  })

  test("should call endpoint successfully", async () => {
    const callResult = await restCallAdapter?.simpleGet<{ message: string }>("/hello")
    expect(callResult?.message).toEqual("this is mockserver in testcontainers")
  })
})

async function createMockServerContainer() {
  const container = await new GenericContainer("mockserver/mockserver")
    .withExposedPorts(1080)
    .withWaitStrategy(Wait.forLogMessage("started on port: 1080", 1))
    .start()
  return container
}

async function createMockServerExpectations(container: StartedTestContainer) {
  await mockServerClient("localhost", container.getMappedPort(1080))
    .mockSimpleResponse('/hello', { message: 'this is mockserver in testcontainers' }, 200)

}
