import fastify from "fastify";
import cookie from "@fastify/cookie";
import { transactionsRoutes } from "./routes/transactions";

// Testes Unitários: Vai testar somente uma unidade especifica da aplicação
// Testes Integração: Quando testa a comunicação entre duas ou mais funcionalidades
// e2e - ponta a ponta: Testes que simulam um usuário operando na nossa aplicação

// Pirâmide de Testes: E2E (não dependem de nenhuma tecnologia, não dependem de arquitetura)

export const app = fastify();

app.register(cookie);

app.register(transactionsRoutes, {
  prefix: "transactions",
});
