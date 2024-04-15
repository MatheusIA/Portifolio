import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

// Cookies === Formas da gente manter contexto entre requisições

export async function transactionsRoutes(app: FastifyInstance) {
  // Adicionando um plugin global, que vai ser utilizado só dentro da rota onde ele estiver.
  app.addHook("preHandler", async (request) => {
    console.log(`[${request.method}] ${request.url}`);
  });

  app.get(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();

      return { transactions };
    },
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getTransactionParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const transaction = await knex("transactions")
        .where({
          session_id: sessionId,
          id,
        })
        .first();

      return { transaction };
    },
  );

  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amout", { as: "Amount" })
        .first();

      return { summary };
    },
  );

  app.post("/", async (request, reply) => {
    const createTransacationBodySchema = z.object({
      title: z.string(),
      amout: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    // Parse está validando os dados, para verificar se os dados do body, estão batendo com o schema que foi definido
    const { title, amout, type } = createTransacationBodySchema.parse(
      request.body,
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        // colocando só o '/', significa que todas as minhas rotas, podem acessar
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // Sequencia: segundos, minutos, dia, 7 dias
      });
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amout: type === "credit" ? amout : amout * -1,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });
}
