import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { makeCreatGymUseCase } from "@/use-cases/factories/make-create-gym-use-case";

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const createGymBodySchema = z.object({
    title: z.string(),
    description: z.string().nullable(),
    phone: z.string().nullable(),

    // Fazendo uma verificação com o proprio Zode. Verificando se o número informado é menor que 90
    // Por padrão a latitude sempre é menor que 90
    latitude: z.number().refine((value) => {
      return Math.abs(value) <= 90;
    }),
    longitude: z.number().refine((value) => {
      return Math.abs(value) <= 180;
    }),
  });

  const { title, description, phone, latitude, longitude } =
    createGymBodySchema.parse(request.body);

  const createGymUseCase = makeCreatGymUseCase();

  await createGymUseCase.execute({
    title,
    description,
    phone,
    latitude,
    longitude,
  });

  return reply.status(201).send();
}
