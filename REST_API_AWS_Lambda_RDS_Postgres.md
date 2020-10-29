# CRUD REST API with Lambda, RDS (Postgres), VPC and logging

> This demonstrates a full CRUD REST API implementation with Postgres/RDS, VPC and logging

including:

##### REST API

-   CRUD (feature module specific)
-   PG Promise
-   DB Migrations
-   Transactional Internal Integration testing with Docker
-   Factories/Fixtures

##### local API / DB delivery

-   Docker
-   Express
-   Postgres

##### AWS API delivery

using AWS CDK, including:

-   VPC
-   RDS
-   Lambda (Custom asset bundling with Webpack, and external SQL files)

##### AWS Config Management

using AWS CDK, including support for:

-   Paramstore
-   Secrets Manager
-   Local Static Config

##### Logging

Using a custom Winston Logger, including:

-   AWS Cloudwatch Transport
-   Console Transport (for local logging)

### Related

-   [REST API / AWS CDK (Lambda / Config / Cognito Passwordless Email Auth with Admin only user creation)](int__api__rest--aws__cdk__api_gateway__lambda__code_asset__webpack--aws__cdk__config--aws__cdk__cognito__custom__passwordless_email__admin)

### Composition

This integration branch is composed of the following isolation branches:

-   [REST API (CRUD) / PostgreSQL (PG Promise)](api__rest__crud__postgresql__pg_promise)
-   [AWS CDK (API Gateway + Lambdas + webpack code bundling)](iso__aws__cdk__api_gateway__lambda__code_asset__webpack)
-   [AWS CDK (Config)](iso__aws__cdk__config)
-   [AWS CDK (VPC)](iso__aws__cdk__vpc)
-   [AWS CDK (RDS)](iso__aws__cdk__rds)
-   [Logging Winston (Cloudwatch)](iso__logging__winston__cloudwatch)

## Design

### `books-api-aws-cdk` package

##### summary

-   creates VPC, RDS and Lambda REST API stacks
    using their respective packages
    and through a common `BooksAPI` Construct

##### details

-   imports VPC, RDS and Lambda REST API stacks from their respective packages
-   creates the Books API App and Lambda REST API stack (but does not yet create the actual lambdas)
-   creates the VPC stack
-   creates the RDS stack (providing it with required VPC settings/data)
-   then creates the Lambdas on Books API App (providing it with required VPC settings/data)

## Code

### `books-api` package

> Contains all the API code (DB interaction, request/response handlers, business logic etc) for the Books API,
> but is platform agnostic, so knows nothing about AWS or express or wherever it's going to be "served".

```text
+-- data
    +-- migrations
+-- src
    +-- common
        +-- data
        +-- http-response
        +-- logging
        +-- postgres
    +-- modules
        +-- books
            +-- business
            +-- data
            +-- persistence
            +-- presentation
```

### `books-api-aws-cdk` package

> Deploys the Books API package (including VPC, RDS & Lambda REST API stacks) to AWS using AWS CDK

```text
+-- src
    +-- cloudformation
    +-- config
        +-- aws-params.json
        +-- aws-secrets.json
        +-- static.json
    +-- modules
        +-- books-api
            +-- books-api.construct.ts
            +-- books-api.construct.test.ts
    +-- index.ts
```

[src/index.ts](https://raw.githubusercontent.com/Nona-Creative/nona-playground/int__api__rest__crud__postgresql__pg_promise--aws__cdk__config--aws__cdk__api_gateway__lambda__code_asset__webpack--aws__cdk__rds--aws__cdk__vpc--logging__winston__cloudwatch/packages/books-api-aws-cdk/src/index.ts)

```typescript
import 'source-map-support/register'
import { App } from '@aws-cdk/core'

import { BooksApi } from './modules/books-api'

const stage = process.env.STAGE || 'dev'
const appId = `${process.env.APP_NAME}-${process.env.PACKAGE_NAME}`

// App

const app = new App()

// Lambda REST API, VPC & RDS stacks

const booksApi = new BooksApi(app, appId, { stage })
booksApi.createLambdaRestApi()
booksApi.loadConfig()
booksApi.createVPCStack()
booksApi.createRDSStack()

const codeZipPath = `assets/${appId}-handlers.zip`
const codeFilename = `${appId}-handlers`
booksApi.createLambdas(codeZipPath, codeFilename)

app.synth()
```

[src/config/aws-params.json](https://raw.githubusercontent.com/Nona-Creative/nona-playground/int__api__rest__crud__postgresql__pg_promise--aws__cdk__config--aws__cdk__api_gateway__lambda__code_asset__webpack--aws__cdk__rds--aws__cdk__vpc--logging__winston__cloudwatch/packages/books-api-aws-cdk/src/config/aws-params.json)

```json
{
  "STAGE": "stage",
  "LOG_LEVEL": "logLevel",
  "PG_DATABASE": "postgres/db",
  "PG_HOST": "postgres/host",
  "PG_PORT": "postgres/port",
  "PG_USER": "postgres/user"
}
```

[src/config/aws-secrets.json](https://raw.githubusercontent.com/Nona-Creative/nona-playground/int__api__rest__crud__postgresql__pg_promise--aws__cdk__config--aws__cdk__api_gateway__lambda__code_asset__webpack--aws__cdk__rds--aws__cdk__vpc--logging__winston__cloudwatch/packages/books-api-aws-cdk/src/config/aws-params.json)

```json
{
  "PG_PASSWORD": "dbMasterPassword"
}
```

[src/config/static.json](https://raw.githubusercontent.com/Nona-Creative/nona-playground/int__api__rest__crud__postgresql__pg_promise--aws__cdk__config--aws__cdk__api_gateway__lambda__code_asset__webpack--aws__cdk__rds--aws__cdk__vpc--logging__winston__cloudwatch/packages/books-api-aws-cdk/src/config/static.json)

```json
{
  "APP_ROOT_PATH": "/var/task",
  "ENVIRONMENT": "aws"
}
```

[src/modules/books-api/books-api.construct.test.ts](https://raw.githubusercontent.com/Nona-Creative/nona-playground/int__api__rest__crud__postgresql__pg_promise--aws__cdk__config--aws__cdk__api_gateway__lambda__code_asset__webpack--aws__cdk__rds--aws__cdk__vpc--logging__winston__cloudwatch/packages/books-api-aws-cdk/src/modules/books-api/books-api.construct.test.ts)

[src/modules/books-api/books-api.construct.ts](https://raw.githubusercontent.com/Nona-Creative/nona-playground/int__api__rest__crud__postgresql__pg_promise--aws__cdk__config--aws__cdk__api_gateway__lambda__code_asset__webpack--aws__cdk__rds--aws__cdk__vpc--logging__winston__cloudwatch/packages/books-api-aws-cdk/src/modules/books-api/books-api.construct.ts)

`BooksApi.createVPCStack`

```typescript
createVPCStack(): void {
  this.vpcStack = new VPCStack(this.scope, `${this.id}-vpc-${this.stage}`, { stage: this.stage })
  this.vpcStack.createSecurityGroup({
    name: LAMBDA_VPC_SECURITY_GROUP_NAME,
    description: 'Lambda Security Group for app VPC',
  })
  this.vpcStack.createSecurityGroup({
    name: RDS_VPC_SECURITY_GROUP_NAME,
    description: 'RDS Security Group for app VPC',
    allowAllOutbound: false,
  })
  this.vpcStack.addSecurityGroupIngressRule({
    targetSecurityGroupName: RDS_VPC_SECURITY_GROUP_NAME,
    sourceSecurityGroupName: LAMBDA_VPC_SECURITY_GROUP_NAME,
    port: RDS_PORT,
  })
}
```

`BooksApi.createRDSStack`

```typescript
  createRDSStack(): void {
    if (isNil(this.vpcStack)) {
      throw new Error(ERROR_MESSAGE_MISSING_AWS_CDK_STACK_VPC)
    }

    if (pathSatisfies(isNil, ['vpcStack', 'securityGroups', RDS_VPC_SECURITY_GROUP_NAME])(this)) {
      throw new Error(ERROR_MESSAGE_MISSING_AWS_VPC_SECURITY_GROUP_RDS)
    }

    const rdsSecurityGroup = path(['vpcStack', 'securityGroups', RDS_VPC_SECURITY_GROUP_NAME])(this) as SecurityGroup
    this.rdsStack = new RDSStack(this.scope, `${this.id}-rds-${this.stage}`, {
      stage: this.stage,
      vpc: this.vpcStack.vpc,
      securityGroup: rdsSecurityGroup,
    })

    const { PG_USER, PG_DATABASE, PG_PASSWORD, PG_PORT } = this.configData
    this.rdsStack.createDatabase({ user: PG_USER, databaseName: PG_DATABASE, password: PG_PASSWORD, port: PG_PORT })
  }
```

`BooksApi.createLambdaRestApi`

```typescript
createLambdaRestApi(): void {
  this.apiGatewayStack = new ApiGatewayStack(this.scope, `${this.id}-lambda-${this.stage}`, {
    stage: this.stage,
  })
}
```

`BooksApi.loadConfig`

```typescript
  loadConfig(): void {
    if (isNil(this.apiGatewayStack)) {
      throw new Error(ERROR_MESSAGE_MISSING_AWS_CDK_STACK_REST_API)
    }

    // load AWS config
    const awsConfig = new AWSConfig(this.apiGatewayStack, `${this.id}-config-${this.stage}`, {
      stage: this.stage,
      appName: process.env.APP_NAME || '',
      packageName: process.env.PACKAGE_NAME || '',
      paramStoreKeys: PARAM_STORE_KEYS,
      secretsManagerKeys: SECRETS_MANAGER_KEYS,
      secretsArn: process.env.SECRETS_ARN || '',
    })
    const configData = awsConfig.loadConfig()

    // derive additional config
    const { PG_USER, PG_PASSWORD, PG_DATABASE, PG_PORT, PG_HOST } = configData
    const DATABASE_URL = buildDatabaseConnectionURL({
      user: PG_USER,
      databaseName: PG_DATABASE,
      password: PG_PASSWORD,
      port: PG_PORT,
      host: PG_HOST,
    })
    const derivedConfig = { DATABASE_URL }

    // merged configs
    this.configData = mergeRight(mergeRight(configData, derivedConfig), STATIC_CONFIG)
  }
```

`BooksApi.createLambdas`

```typescript
  createLambdas(codeZipPath: string, codeFilename: string): void {
    if (isNil(this.apiGatewayStack)) {
      throw new Error(ERROR_MESSAGE_MISSING_AWS_CDK_STACK_REST_API)
    }

    if (isNil(this.configData)) {
      throw new Error(ERROR_MESSAGE_MISSING_AWS_CONFIG)
    }

    const functionProps: Partial<FunctionProps> = this.lambdaVpcConfig
    const functionNamePrefix = `${this.id}-${this.stage}`
    const _buildLambdaFunction = buildLambdaFunction(
      Code.fromAsset(codeZipPath),
      codeFilename,
      functionNamePrefix,
      functionProps,
    )

    // ... build Lambdas
    const getBooksLambda = _buildLambdaFunction(this.apiGatewayStack, 'getBooks', this.configData)
    const getBookLambda = _buildLambdaFunction(this.apiGatewayStack, 'getBook', this.configData)
    const createBookLambda = _buildLambdaFunction(this.apiGatewayStack, 'createBook', this.configData)
    const updateBookLambda = _buildLambdaFunction(this.apiGatewayStack, 'updateBook', this.configData)

    // ... attach Lambdas through resources and methods
    const books = this.apiGatewayStack.addResource('books', 'GET', getBooksLambda, this.apiGatewayStack.api.root)
    const book = this.apiGatewayStack.addResource('{id}', 'GET', getBookLambda, books)
    this.apiGatewayStack.addMethod('POST', createBookLambda, books)
    this.apiGatewayStack.addMethod('PATCH', updateBookLambda, book)
  }
```

## Usage

> Check out docs on [AWS Profile](https://github.com/Nona-Creative/nona-playground/blob/iso__base/docs/common/aws-profile.md) usage before you run the commands below.

### Setup Project

```bash
npm run init
```

### Envs

##### AWS Secrets Manager

Create the following secret:

```json
dbMasterPassword: <db password>
```

Then copy the resulting ARN and use it to populate `SECRETS_ARN` in local env `packages/books-api-aws-cdk/.env.dev`

##### AWS Paramstore

Add the following params to AWS Paramstore:

-   `nona-playground/books-api/dev/stage`
-   `nona-playground/books-api/dev/logLevel`
-   `nona-playground/books-api/dev/postgres/db`
-   `nona-playground/books-api/dev/postgres/host`
-   `nona-playground/books-api/dev/postgres/port`
-   `nona-playground/books-api/dev/postgres/user`

### Deploy

```bash
npm run books-api:aws:deploy dev
```

You can also remove (once you are done) with:

```bash
npm run books-api:aws:destroy dev
```

### Run Migrations

configure the following vars in `packages/books-api/.env.dev` in order to run migrations:

    POSTGRES_HOST
    POSTGRES_USER
    POSTGRES_PASSWORD
    POSTGRES_DB
    POSTGRES_PORT

run migrations:

```bash
cd packages/books-api
npm run migrate:dev up
```

You can also now populate the `books` table with some example data.

### Test

```bash
http <URL>/books
```

