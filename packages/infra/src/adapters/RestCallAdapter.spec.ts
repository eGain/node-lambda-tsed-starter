import { RestCallAdapter } from "./RestCallAdapter"

describe("RestCallAdapter", () => {
  const restCallAdapter = new RestCallAdapter()

  test("should create instance successfully", () => {
    expect(restCallAdapter).toBeInstanceOf(RestCallAdapter)
  })

  test("should call endpoint successfully", async () => {
    const callResult = await restCallAdapter.simpleGet<{ message: string }>("/hello")
    expect(callResult.message).toEqual("this is mockserver")
  })
})
