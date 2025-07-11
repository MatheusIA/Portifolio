import { auth } from "@/http/middlewares/auth";
import { prisma } from "@/lib/prisma";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { getUserPermissions } from "@/utils/get-user-permissions";
import { UnauthorizedError } from "../_errors/unauthorized-error";
import { roleSchema } from "@saas/auth";

export async function removeMembers(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .delete('/organizations/:slug/members/:memberId', {
            schema: {
                tags: ['Members'],
                summary: 'Remove a member from the organization',
                security: [{ bearerAuth: []}],
                params: z.object({
                    slug: z.string(),
                    memberId: z.string().uuid()
                }),
                response: {
                    204: z.null()
                    }
                }
            },

            async (request, reply) => {
                const { slug, memberId } = request.params
                const userId = await request.getCurrentUserId()
                const { organization, membership } = await request.getUserMembership(slug)
                
                const { cannot } = getUserPermissions(userId, membership.role)

                if(cannot('delete', 'User')) {
                    throw new UnauthorizedError(`You're not allowed to remove this member from the organization.`)
                }

                await prisma.member.delete({
                    where: {
                        id: memberId,
                        organizationId: organization.id
                    }
                })

                return reply.status(204).send()
        })
}