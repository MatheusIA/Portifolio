import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { BadRequestError } from "../_errors/bad-request-error";
import { auth } from "@/http/middlewares/auth";
import { roleSchema } from "@saas/auth";

export async function getPendingInvites(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .post('/pending-invites', {
            schema: {
                tags: ['Invites'],
                summary: 'Get all user pending invites',
                response: {
                    200: z.object({
                        invites: z.array(
                            z.object({
                                id: z.string().uuid(),
                                email: z.string().email(),
                                role: roleSchema,
                                createdAt: z.date(),
                                organization: z.object({
                                    name: z.string()
                                }),
                                author: z.object({
                                    id: z.string().uuid(),
                                    name: z.string().nullable(),
                                    avatarUrl: z.string().url().nullable()
                                }).nullable()
                            })
                        )
                    })
                }
            }
        },
            async (request, reply) => {
                const userId = await request.getCurrentUserId()

                const user = await prisma.user.findUnique({
                    where: {
                        id: userId
                    }
                })

                if(!user){
                    throw new BadRequestError('User not found.')
                }

                const invites = await prisma.invite.findMany({
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        author: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true
                            }
                        },
                        organization: {
                            select: {
                                name: true
                            }
                        }
                    },
                    where: {
                        id: user.email
                    },
                })
              

                return { invites }
            })
}