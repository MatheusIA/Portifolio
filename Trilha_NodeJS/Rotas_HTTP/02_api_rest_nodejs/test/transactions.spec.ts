/* eslint-disable prettier/prettier */
import {  it,  test,  beforeAll,  afterAll,  describe,  expect,  beforeEach} from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";

// Todo teste obrigatóriamente deve se excluir de qualquer contexto
// Jamais posso escrever um teste, que depende de outro teste

describe("Transactions routes", () => {
  beforeAll(async () => {
    // Antes de todos os testes, quero aguardar que todos os pluguins sejam instalados
    await app.ready();
  });

  // Depois que todas os testes serem executados, eu fecho a aplicação e tiro da memória
  afterAll(async () => {
    await app.close();
  });

  // Testes end to end: O ideal é que o banco de dados esteja zerado, após a execução de cada teste
  // ExecSync permite que códigos que seriam digitados no terminal, sejam digitados e executados direto no código

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync("npm run knex migrate:latest");
  });

  test("user can create a new transaction", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amout: 5000,
        type: "credit",
      })
      .expect(201);
    // ou  expect(response.statusCode).toEqual(201)
  });

  it("should be able to list all transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amout: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "New Transaction",
        amout: 5000,
      }),
    ]);
  });

  it("should be able to get a specific transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "New Transaction",
        amout: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

      const transactionId = listTransactionsResponse.body.transactions[0].id

      const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "New Transaction",
        amout: 5000,
      }),
    );
  });

  it("should be able to the summary", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Credit Transaction",
        amout: 5000,
        type: "credit",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

   await request(app.server)
      .post("/transactions")
      .set('Cookie', cookies)
      .send({
        title: "Debit Transaction",
        amout: 2000,
        type: "debit",
      });

    const summaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(summaryResponse.body.summary).toEqual({
      Amount: 3000
    })
  });

});
