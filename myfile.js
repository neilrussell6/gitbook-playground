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
