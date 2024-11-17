import fastify from 'fastify'
import cookie from '@fastify/cookie'
import websocket from '@fastify/websocket'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { createPoll } from './routes/create-poll'
import { getPoll } from './routes/get-poll'
import { voteOnPoll } from './routes/vote-on-poll'
import { pollResults } from './ws/poll-results'

const app = fastify()

// GET: Toda vez que vai buscar uma informação
// POST: Usado toda vez que vamos criar uma informação
// PUT: Quando for alterar uma informação por completo
// DELETE: Quando for deletar alguma informação
// PATCH: Usado quando for fazer uma alteraçã em um campo especifico no recurso
// HEAD e OPTIONS

app.register(cookie, {
    secret: "polls-app-nlw",
    hook: 'onRequest'
})

app.register(websocket)

app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)

app.register(pollResults)

app.listen({port: 3333}).then(() => {
    console.log("HTTP Server Running !")
})

