import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { roleSchema } from "@saas/auth";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getInvite(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .get('/invites/:inviteId', {
            schema: {
                tags: ['Invites'],
                summary: 'Get an invite',
                params: z.object({
                    inviteId: z.string().uuid()
                }),
                response: {
                    200: z.object({
                        invite: z.object({
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
                        
                    })
                }
            }
        }, 
            async (request, reply) => {
                
               const { inviteId } = request.params

               const invite = await prisma.invite.findUnique({
                where: {
                    id: inviteId
                },
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
                }
               })

               if (!invite) {
                throw new BadRequestError('Invite not found')
               }

                return { invite }
        })
}