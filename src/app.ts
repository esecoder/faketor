import express from 'express'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import logger from 'morgan'
import 'dotenv/config'
import path from 'path'
import indexRouter from './home/homeRoute'
import genRouter from './generator/genRoute'

const app = express()

app.use(cors({credentials: true}))
app.use(compression())
app.use(cookieParser())
app.use(bodyParser.json())
app.use(logger('dev'))
//app.use(express.json())
app.use(express.urlencoded({ extended: false }))
//app.use(express.static(path.join(__dirname, 'public')))

app.use('/v1', indexRouter)
app.use('/v1/generate', genRouter)

export default app
