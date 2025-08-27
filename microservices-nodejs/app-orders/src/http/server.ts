import fastify from 'fastify'
import { randomUUID } from 'node:crypto'
import { fastifyCors } from '@fastify/cors'
import { z } from 'zod'

import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { channels } from '../broker/channels/index.ts'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*'})

app.get('/health', () => {
    return 'OK'
})

app.post('/orders', {
    schema: {
        body: z.object({
            amount: z.coerce.number()
        })
    }
}, async (request, reply) => {

    const { amount } = request.body

    console.log("Creating an order with amout: ", amount)

    const orderId = randomUUID()

    dispatchOrderCreated({
        orderId,
        amount,
        customer: {
            id: 'fba243fc-c93a-471b-816a-667f1a7e6048',
        }
    })

    await db.insert(schema.orders).values({
        id: randomUUID(),
        customerId: 'fba243fc-c93a-471b-816a-667f1a7e6048',
        amount
    })

    return reply.status(201).send()
})

app.listen({ host: '0.0.0.0', port: 3333}).then(() => {
    console.log('[Orders] HTTP Server Running !')
})