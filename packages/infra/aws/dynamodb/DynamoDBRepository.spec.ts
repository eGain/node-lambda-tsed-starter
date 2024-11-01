import { DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { marshall } from "@aws-sdk/util-dynamodb"
import { BaseDocument } from "@project/domain/document/BaseDocument.js"
import { Injectable } from "@tsed/di"
import { PlatformTest } from "@tsed/platform-http/testing"
import { Property, Required } from "@tsed/schema"
import { afterAll, beforeAll, expect } from "vitest"

import { DynamoDBRepository } from "./DynamoDBRepository.js"

vi.mock("@aws-sdk/util-dynamodb", () => {
  return {
    unmarshall: vi.fn().mockImplementation((data) => data),
    marshall: vi.fn().mockImplementation((data) => data)
  }
})

vi.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDB: class {
      constructor(public opts: never) {}
    },
    DeleteItemCommand: class DeleteItemCommand {
      constructor(public input: never) {}
    },
    GetItemCommand: class GetItemCommand {
      constructor(public input: never) {}
    },
    PutItemCommand: class PutItemCommand {
      constructor(public input: never) {}
    },
    ScanCommand: class ScanCommand {
      constructor(public input: never) {}
    }
  }
})

vi.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocumentClient: class {
      static from = vi.fn().mockReturnValue({})
    }
  }
})

class MyModel extends BaseDocument {
  @Required()
  @Property()
  label: string
}

@Injectable()
class ModelsRepository extends DynamoDBRepository<MyModel> {
  protected tableName = "models"
  protected model = MyModel
}

async function getRepositoryFixture() {
  const dynamoDBDocClient = {
    send: vi.fn()
  }
  const repository = await PlatformTest.invoke<ModelsRepository>(ModelsRepository, [
    {
      token: DynamoDBDocumentClient,
      use: dynamoDBDocClient
    }
  ])

  return {
    repository,
    dynamoDBDocClient
  }
}

describe("DynamoDBRepository", () => {
  beforeAll(() => {
    vi.useFakeTimers({
      now: new Date("2024-01-01T00:00:00.000Z")
    })
  })
  afterAll(() => {
    vi.useRealTimers()
  })
  beforeEach(() => PlatformTest.create())
  afterEach(() => PlatformTest.reset())

  describe("getById()", () => {
    it("should get a model by id", async () => {
      const { repository, dynamoDBDocClient } = await getRepositoryFixture()

      dynamoDBDocClient.send.mockResolvedValue({
        Item: {
          id: "id",
          label: "label",
          created_at: "2021-01-01T00:00:00.000Z",
          updated_at: "2021-01-01T00:00:00.000Z"
        }
      })

      const result = await repository.getById("id")

      expect(result).toEqual({
        createdAt: new Date("2021-01-01T00:00:00.000Z"),
        id: "id",
        label: "label",
        updatedAt: new Date("2021-01-01T00:00:00.000Z")
      })
      expect(dynamoDBDocClient.send).toHaveBeenCalledWith(
        new GetItemCommand({
          TableName: "models",
          Key: marshall({ id: "id" })
        })
      )
    })
    it("should return null if id isn't unknown", async () => {
      const { repository, dynamoDBDocClient } = await getRepositoryFixture()

      dynamoDBDocClient.send.mockResolvedValue({
        Item: null
      })

      const result = await repository.getById("id")

      expect(result).toEqual(null)
    })
  })
  describe("getAll()", () => {
    it("should get all models", async () => {
      const { repository, dynamoDBDocClient } = await getRepositoryFixture()

      dynamoDBDocClient.send.mockResolvedValue({
        Items: [
          {
            id: "id",
            label: "label",
            created_at: "2021-01-01T00:00:00.000Z",
            updated_at: "2021-01-01T00:00:00.000Z"
          }
        ]
      })

      const result = await repository.getAll({
        limit: 10
      })

      expect(result).toEqual([
        {
          createdAt: new Date("2021-01-01T00:00:00.000Z"),
          id: "id",
          label: "label",
          updatedAt: new Date("2021-01-01T00:00:00.000Z")
        }
      ])
      expect(dynamoDBDocClient.send).toHaveBeenCalledWith(
        new ScanCommand({
          TableName: "models",
          Limit: 10
        })
      )
    })
    it("should return empty array", async () => {
      const { repository, dynamoDBDocClient } = await getRepositoryFixture()

      dynamoDBDocClient.send.mockResolvedValue({
        Items: undefined
      })

      const result = await repository.getAll({
        limit: 10
      })

      expect(result).toEqual([])
      expect(dynamoDBDocClient.send).toHaveBeenCalledWith(
        new ScanCommand({
          TableName: "models",
          Limit: 10
        })
      )
    })
  })
  describe("create()", () => {
    it("should create a model", async () => {
      const { repository, dynamoDBDocClient } = await getRepositoryFixture()

      dynamoDBDocClient.send.mockResolvedValue({})

      const model = new MyModel()
      model.label = "label"

      const result = await repository.create(model)

      expect(result).toEqual({
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        id: expect.any(String),
        label: "label",
        updatedAt: new Date("2024-01-01T00:00:00.000Z")
      })
      expect(dynamoDBDocClient.send).toHaveBeenCalledWith(
        new PutItemCommand({
          TableName: "models",
          Item: {
            id: expect.any(String),
            label: "label",
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z"
          } as never
        })
      )
    })
  })
  describe("save()", () => {
    it("should save a model", async () => {
      const { repository, dynamoDBDocClient } = await getRepositoryFixture()

      dynamoDBDocClient.send.mockResolvedValue({})

      const model = new MyModel()
      model.label = "label"
      model.id = "id"
      model.createdAt = new Date("2021-01-01T00:00:00.000Z")

      const result = await repository.save(model)

      expect(result).toEqual({
        createdAt: new Date("2021-01-01T00:00:00.000Z"),
        id: "id",
        label: "label",
        updatedAt: new Date("2024-01-01T00:00:00.000Z")
      })
      expect(dynamoDBDocClient.send).toHaveBeenCalledWith(
        new PutItemCommand({
          TableName: "models",
          Item: {
            id: expect.any(String),
            label: "label",
            created_at: "2021-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z"
          } as never
        })
      )
    })
  })

  describe("delete()", () => {
    it("should delete a model", async () => {
      const { repository, dynamoDBDocClient } = await getRepositoryFixture()

      dynamoDBDocClient.send.mockResolvedValue({})

      const result = await repository.delete("id")

      expect(result).toEqual(undefined)
      expect(dynamoDBDocClient.send).toHaveBeenCalledWith(
        new DeleteItemCommand({
          TableName: "models",
          Key: {
            id: "id"
          } as never
        })
      )
    })
  })
})
