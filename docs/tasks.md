## TODO
### Handle updates to build artifacts after code change
Right now, if I modify a domain object it will not show in Swagger UI. Seems that the flow is to compile and restart the server.
Do we need a global build for dev mode script? 
Can the watch scope of the server be modified?

## Reduce build size

### Look at:
https://aws.amazon.com/blogs/compute/optimizing-node-js-dependencies-in-aws-lambda/
https://aws.amazon.com/blogs/developer/how-we-halved-the-publish-size-of-modular-aws-sdk-for-javascript-clients/
https://github.com/dougmoscrop/serverless-plugin-include-dependencies
https://www.serverless.com/framework/docs/providers/aws/guide/packaging/

https://vladholubiev.com/articles/3x-smaller-lambda-artifacts-by-removing-junk-from-nodemodules
https://dev.to/alanneves/optimizing-aws-lambda-how-to-reduce-nodejs-application-bundle-size-2hi1
https://blog.thewiz.net/cleanup-the-nodemodules-for-a-lighter-lambda-function
https://www.reddit.com/r/aws/comments/u5hy30/aws_lambda_optimizing_node_modules_in_zip_files/
https://stackoverflow.com/questions/45075395/reduce-the-size-of-the-node-modules-zip-sent-by-the-serverless-framework
