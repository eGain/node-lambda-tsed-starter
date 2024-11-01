import { catchAsyncError } from "@tsed/core"
import { Injectable, runInContext } from "@tsed/di"
import { Exception } from "@tsed/exceptions"
import { PlatformTest } from "@tsed/platform-http/testing"
import { Property, Required } from "@tsed/schema"

import { HttpClient } from "./HttpClient.js"

@Injectable()
class CustomHttpClient extends HttpClient {
  callee = "CUSTOM_HTTP_CLIENT"
}

vi.mock("axios", () => {
  const axiosMock = vi.fn()

  return {
    default: {
      create: vi.fn().mockReturnValue(axiosMock)
    },
    create: vi.fn().mockReturnValue(axiosMock)
  }
})

class Model {
  @Required()
  @Property()
  id: string;

  [key: string]: never | string

  constructor(props: Partial<Model> = {}) {
    Object.assign(this, props)
  }
}

class Payload {
  @Required()
  @Property()
  id: string;

  [key: string]: never | string

  constructor(props: Partial<Model> = {}) {
    Object.assign(this, props)
  }
}

class Model2 {
  @Required()
  @Required()
  @Property()
  id: string

  constructor(props: Partial<Model> = {}) {
    Object.assign(this, props)
  }
}

async function createServiceFixture() {
  const client = await PlatformTest.invoke<CustomHttpClient>(CustomHttpClient)
  const ctx = PlatformTest.createRequestContext()

  vi.spyOn(ctx.logger, "info")
  vi.spyOn(ctx.logger, "warn")

  return { client, ctx }
}

describe("HttpClient", () => {
  beforeEach(() => PlatformTest.create())
  afterEach(() => PlatformTest.reset())

  describe("head()", () => {
    it("should call send method", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()

      vi.mocked(client.raw).mockResolvedValue({
        headers: {
          "x-test": "test"
        }
      })
      // WHEN
      const result = await runInContext(ctx, () =>
        client.head("/test", {
          headers: {
            "x-api": "x-api"
          }
        })
      )

      expect(result).toEqual({
        "x-test": "test"
      })
    })
  })
  describe("get()", () => {
    it("should make a request", async () => {
      const { client, ctx } = await createServiceFixture()

      vi.spyOn(client as never, "raw").mockReturnValue(
        Promise.resolve({
          headers: {
            "x-request-id": "id"
          },
          data: {
            id: "id",
            additionalProperties: "hello"
          }
        })
      )

      // WHEN
      const result = await runInContext(ctx, () =>
        client.get("/test", {
          params: {
            param1: 7,
            param2: "test"
          },
          headers: {
            "x-api": "x-api"
          },
          type: Model2
        })
      )

      expect(result).toEqual(
        new Model({
          id: "id"
        })
      )
      expect(ctx.logger.info).toHaveBeenCalledWith({
        callee: "CUSTOM_HTTP_CLIENT",
        callee_request_body: undefined,
        callee_request_headers: "",
        callee_request_qs: "param1=7&param2=test",
        callee_response_body: undefined,
        callee_response_code: undefined,
        callee_response_headers: "",
        curl: undefined,
        duration: expect.any(Number),
        method: "GET",
        request_id: "id",
        state: "OK",
        url: "/test"
      })
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "GET",
        params: {
          param1: 7,
          param2: "test"
        },
        data: undefined,
        headers: {
          "x-api": "x-api"
        }
      })
    })
    it("should make a request (with additionalProperties)", async () => {
      const { client, ctx } = await createServiceFixture()

      vi.spyOn(client as never, "raw").mockReturnValue(
        Promise.resolve({
          headers: {},
          data: {
            id: "id",
            hello: "hello"
          }
        })
      )

      // WHEN
      const result = await runInContext(ctx, () =>
        client.get("/test", {
          headers: {
            "x-api": "x-api"
          },
          type: Model,
          additionalProperties: true
        })
      )

      expect(result).toEqual(
        new Model({
          hello: "hello",
          id: "id"
        })
      )
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "GET",
        headers: {
          "x-api": "x-api"
        }
      })
    })
    it("should make a request and return a stream", async () => {
      const { client, ctx } = await createServiceFixture()

      vi.spyOn(client as never, "raw").mockReturnValue(Promise.resolve({ data: "stream" }))

      // WHEN
      const result = await runInContext(ctx, () =>
        client.get("/test", {
          headers: {
            "x-api": "x-api"
          },
          type: Model,
          additionalProperties: true,
          responseType: "stream"
        })
      )

      expect(result).toEqual({ data: "stream" })
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "GET",
        responseType: "stream",
        headers: {
          "x-api": "x-api"
        }
      })
    })
    it("should throw error (without response information)", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()

      vi.spyOn(client as never, "raw").mockRejectedValue({
        message: "message"
      })

      // WHEN
      const error = await catchAsyncError<Exception>(() =>
        runInContext(ctx, () =>
          client.get("/test", {
            params: {
              param1: 7,
              param2: "test"
            },
            headers: {
              "x-api": "x-api"
            },
            type: Model,
            additionalProperties: true
          })
        )
      )

      expect(error?.message).toEqual("Internal Server Error")
      expect(error?.status).toEqual(500)
      expect(error?.headers).toEqual({})
      expect(error?.body).toEqual(undefined)
      expect(!!error?.stack).toEqual(true)
    })
    it("should throw error (with response information)", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()

      vi.spyOn(client as never, "raw").mockRejectedValue({
        message: "message",
        response: {
          status: 400,
          headers: {
            "x-test": "test"
          },
          data: {
            message: "Validation error"
          }
        }
      })

      // WHEN
      const error = await catchAsyncError<Exception>(() =>
        runInContext(ctx, () =>
          client.get("/test", {
            params: {
              param1: 7,
              param2: "test"
            },
            headers: {
              "x-api": "x-api"
            },
            type: Model,
            additionalProperties: true
          })
        )
      )

      expect(error?.message).toEqual("Validation error")
      expect(error?.status).toEqual(400)
      expect(error?.headers).toEqual({
        "x-test": "test"
      })
      expect(error?.body).toEqual({ message: "Validation error" })
      expect(!!error?.stack).toEqual(true)
      expect(ctx.logger.warn).toHaveBeenCalledWith({
        callee: "CUSTOM_HTTP_CLIENT",
        callee_error: "message",
        callee_request_body: undefined,
        callee_request_headers: '{"x-api":"x-api"}',
        callee_request_qs: "param1=7&param2=test",
        callee_response_body: '{"message":"Validation error"}',
        callee_response_code: 400,
        callee_response_headers: '{"x-test":"test"}',
        curl: "curl -X GET '/test?param1=7&param2=test' -H 'x-api: x-api'",
        duration: expect.any(Number),
        method: "GET",
        request_id: "id",
        state: "KO",
        url: "/test"
      })
    })
    it("should throw error (with partial response information)", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()

      vi.spyOn(client as never, "raw").mockRejectedValue({
        message: "message",
        response: {
          status: 400,
          headers: {
            "x-test": "test"
          },
          statusText: "BAD_REQUEST",
          data: {}
        }
      })

      // WHEN
      const error = await catchAsyncError<Exception>(() =>
        runInContext(ctx, () =>
          client.get("/test", {
            params: {
              param1: 7,
              param2: "test"
            },
            headers: {
              "x-api": "x-api"
            },
            type: Model,
            additionalProperties: true
          })
        )
      )

      expect(error?.message).toEqual("BAD_REQUEST")
      expect(error?.status).toEqual(400)
      expect(error?.headers).toEqual({
        "x-test": "test"
      })
      expect(error?.body).toEqual({})
      expect(!!error?.stack).toEqual(true)
    })
  })
  describe("post()", () => {
    it("should call send (without additionalProperties)", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()
      const payload = new Payload({
        id: "id",
        additionalProperties: "hello"
      })

      vi.spyOn(client as never, "raw").mockReturnValue(
        Promise.resolve({
          headers: {},
          data: {
            id: "id",
            additionalProperties: "hello"
          }
        })
      )

      // WHEN
      const result = await runInContext(ctx, () =>
        client.post("/test", {
          data: payload,
          headers: {
            "x-api": "x-api"
          },
          type: Model2
        })
      )

      expect(result).toEqual(
        new Model({
          id: "id"
        })
      )
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "POST",
        params: undefined,
        data: {
          id: "id"
        },
        headers: {
          "x-api": "x-api"
        }
      })
    })
    it("should call send (with additionalProperties)", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()

      const payload = new Payload({
        id: "id",
        additionalProperties: "hello"
      })

      vi.spyOn(client as never, "raw").mockReturnValue(
        Promise.resolve({
          headers: {},
          data: {
            id: "id",
            hello: "hello"
          }
        })
      )

      // WHEN
      const result = await runInContext(ctx, () =>
        client.post("/test", {
          data: payload,
          headers: {
            "x-api": "x-api"
          },
          type: Model,
          additionalProperties: true
        })
      )

      expect(result).toEqual(
        new Model({
          hello: "hello",
          id: "id"
        })
      )
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "POST",
        data: {
          id: "id"
        },
        params: undefined,
        headers: {
          "x-api": "x-api"
        }
      })
    })
    it("should throw error (with response information)", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()

      vi.spyOn(client as never, "raw").mockRejectedValue({
        message: "message",
        response: {
          status: 400,
          headers: {
            "x-test": "test"
          },
          data: {
            message: "Validation error"
          }
        }
      })

      // WHEN
      const error = await catchAsyncError<Exception>(() =>
        runInContext(ctx, () =>
          client.post("/test", {
            data: {
              id: "id"
            },
            params: {
              param1: 7,
              param2: "test"
            },
            headers: {
              "x-api": "x-api"
            },
            type: Model,
            additionalProperties: true
          })
        )
      )

      expect(error?.message).toEqual("Validation error")
      expect(error?.status).toEqual(400)
      expect(error?.headers).toEqual({
        "x-test": "test"
      })
      expect(error?.body).toEqual({ message: "Validation error" })
      expect(!!error?.stack).toEqual(true)
      expect(ctx.logger.warn).toHaveBeenCalledWith({
        callee: "CUSTOM_HTTP_CLIENT",
        callee_error: "message",
        callee_request_body: '{"id":"id"}',
        callee_request_headers: '{"x-api":"x-api"}',
        callee_request_qs: "param1=7&param2=test",
        callee_response_body: '{"message":"Validation error"}',
        callee_response_code: 400,
        callee_response_headers: '{"x-test":"test"}',
        curl: "curl -X POST '/test?param1=7&param2=test' -d '{\"id\":\"id\"}' -H 'x-api: x-api'",
        duration: expect.any(Number),
        method: "POST",
        request_id: "id",
        state: "KO",
        url: "/test"
      })
    })
  })
  describe("put()", () => {
    it("should make a request", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()
      const payload = new Payload({
        id: "id"
      })

      vi.spyOn(client as never, "raw").mockReturnValue(
        Promise.resolve({
          headers: {},
          data: {
            id: "id"
          }
        })
      )

      // WHEN
      const result = await runInContext(ctx, () =>
        client.put("/test", {
          data: payload,
          headers: {
            "x-api": "x-api"
          },
          type: Model2
        })
      )

      expect(result).toEqual(
        new Model({
          id: "id"
        })
      )
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "PUT",
        params: undefined,
        data: {
          id: "id"
        },
        headers: {
          "x-api": "x-api"
        }
      })
    })
  })

  describe("patch()", () => {
    it("should make a request", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()
      const payload = new Payload({
        id: "id"
      })

      vi.spyOn(client as never, "raw").mockReturnValue(
        Promise.resolve({
          headers: {},
          data: {
            id: "id"
          }
        })
      )

      // WHEN
      const result = await runInContext(ctx, () =>
        client.patch("/test", {
          data: payload,
          headers: {
            "x-api": "x-api"
          },
          type: Model2
        })
      )

      expect(result).toEqual(
        new Model({
          id: "id"
        })
      )
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "PATCH",
        params: undefined,
        data: {
          id: "id"
        },
        headers: {
          "x-api": "x-api"
        }
      })
    })
  })

  describe("delete()", () => {
    it("should make a request", async () => {
      // GIVEN
      const { client, ctx } = await createServiceFixture()
      const payload = new Payload({
        id: "id",
        additionalProperties: "hello"
      })

      vi.spyOn(client as never, "raw").mockReturnValue(
        Promise.resolve({
          headers: {},
          data: {
            id: "id",
            additionalProperties: "hello"
          }
        })
      )

      // WHEN
      const result = await runInContext(ctx, () =>
        client.delete("/test", {
          data: payload,
          headers: {
            "x-api": "x-api"
          },
          type: Model2
        })
      )

      expect(result).toEqual(
        new Model({
          id: "id"
        })
      )
      expect(client.raw).toHaveBeenCalledWith({
        url: "/test",
        method: "DELETE",
        data: {
          id: "id"
        },
        headers: {
          "x-api": "x-api"
        }
      })
    })
  })
})
