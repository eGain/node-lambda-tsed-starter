import "@tsed/ajv" // enable validation
import "@project/infra/aws/log-request/ServerlessLogRequest.js"

import { LambdaAuthorizerController } from "@project/controllers/auth/LambdaAuthorizerController.js"
import { PlatformServerless } from "@tsed/platform-serverless"

// shared configuration
const config = {
  envs: process.env,
  logger: {
    level: "info" as never,
    requestFields: ["reqId", "method", "url", "duration", "route", "aws_event", "aws_context"]
  },
  auth: {
    // Not applicable here because lambda are packaged and deployed on AWS.
    // For this reason, we can't use the file system to store data (prefer S3, DynamoDB, etc.)
    // dbFilePath: join(import.meta.dirname, "../../../../.tmp/timeslots.json")
  }
}

export const authorizer = PlatformServerless.callback(LambdaAuthorizerController, "authorizer", config)
