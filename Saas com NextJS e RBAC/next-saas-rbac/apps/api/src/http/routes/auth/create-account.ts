import { hash } from "bcryptjs"
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "@/lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function createAccount(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .post('/users', {
            schema: {
                tags: ['Auth'],
                summary: "Create a new account",
                body: z.object({
                    name: z.string(),
                    email: z.string().email(),
                    password: z.string().min(6)
                })
            }
        }, 
        async (request, reply) => {
            const { email, name, password } = request.body

            const userWithEmail = await prisma.user.findUnique({
                where: {
                    email
                }
            })

            if (userWithEmail) {
                throw new BadRequestError('User with same e-mail already exists')
            }

            const [, domain] = email.split('@')

            const autoJoinOrganization = await prisma.organization.findFirst({
                where: {
                    domain,
                    shouldAttachUsersByDomain: true
                }
            })

            const passwordHash = await hash(password, 6)

            await prisma.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    member_on: autoJoinOrganization ? {
                        create: {
                            organizationId: autoJoinOrganization.id,
                        }
                    } : undefined
                }
            })

            return reply.status(201).send()

        })
}