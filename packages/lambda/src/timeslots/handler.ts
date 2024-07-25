import "@tsed/ajv" // enable validation
import "@project/infra/aws/log-request/ServerlessLogRequest.js"

import { TimeslotsController } from "@project/controllers/timeslots/TimeslotsController.js"
import { DynamoDBTimeslotsRepository } from "@project/infra/timeslots/DynamoDBTimeslotsRepository.js"
import { TimeslotsRepository } from "@project/infra/timeslots/TimeslotsRepository.js"
import { PlatformServerless } from "@tsed/platform-serverless"

// shared configuration
const config = {
  envs: process.env,
  lambda: [TimeslotsController],
  logger: {
    level: "info" as never,
    requestFields: ["reqId", "method", "url", "duration", "route", "aws_event", "aws_context"]
  },
  timeslots: {
    // Not applicable here because lambda are packaged and deployed on AWS.
    // For this reason, we can't use the file system to store data (prefer S3, DynamoDB, etc.)
    // dbFilePath: join(import.meta.dirname, "../../../../.tmp/timeslots.json")
  },
  imports: [
    {
      token: TimeslotsRepository,
      useClass: DynamoDBTimeslotsRepository
    }
  ]
}

const platform = PlatformServerless.bootstrap(config)

export const timeslots = platform.handler()
