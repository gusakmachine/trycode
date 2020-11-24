import path from 'path'
import http from 'http'
import bodyparser from 'body-parser'
import cookieparser from 'cookie-parser'
import mongoose from "mongoose"
import express from 'express'
import exphbs from 'express-handlebars'

import socker from './socket/server.js'
import tryCodeRouter from './routes/trycode.js'

const app = express()
const server = http.createServer(app)
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', path.join('./', 'views'))
app.use(bodyparser())
app.use(cookieparser())

const port = 3000 || process.env.PORT
app.use(express.static(path.join('./', '/public')))

app.use('/', tryCodeRouter)

mongoose.connect("mongodb://gusak:123@localhost:27017/trycode", { useNewUrlParser: true }, err => {
    if (err)
        return console.log(err)

    socker(server)

    server.listen(port, () => {
        console.log(`Server has been started on ${port} port`)
    })
})