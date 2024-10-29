import { auth } from "@/http/middlewares/auth";
import { roleSchema } from "@saas/auth";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { Role } from "@prisma/client";

export async function getMembership(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get('/organization/:slug/membership', {
            schema: {
                tags: ['Organizations'],
                summary: 'Get user membership on organization',
                security: [{ bearerAuth: []}],
                params: z.object({
                    slug: z.string()
                }),
                response: {
                    200: z.object({
                        membership: z.object({
                            id: z.string().uuid(),
                            role: roleSchema,
                            organizationId: z.string().uuid()
                        })
                    })
                }
            }
        },
        async ( request ) => {
            const { slug } = request.params
            const { membership } = await request.getUserMembership(slug)

            return { 
                membership: {
                    id: membership.id,
                    role: roleSchema.parse(membership.role),
                    organizationId: membership.organizationId
                }
            }
        }
    
    )
}