import request from "supertest";
import { app } from "@/app";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAndAuthenticateUser } from "@/utils/test/create-and-authenticate-user";

describe("Search Gyms (e2e)", () => {
  beforeAll(async () => {
    // Verificando se a nossa aplicação terminou de ser inicializada
    await app.ready();
  });

  afterAll(async () => {
    // Depois dos testes terminar, a aplicação deve se fechada
    await app.close();
  });

  it("should be able search gyms by title ", async () => {
    const { token } = await createAndAuthenticateUser(app, true);

    await request(app.server)
      .post("/gyms")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "JavaScript Gym",
        description: "Some Description",
        phone: "1199999999",
        latitude: -21.417262,
        longitude: -45.9705647,
      });

    await request(app.server)
      .post("/gyms")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "TypeScript Gym",
        description: "Some Description",
        phone: "1199999999",
        latitude: -21.417262,
        longitude: -45.9705647,
      });

    const response = await request(app.server)
      .get("/gyms/search")
      .query({
        q: "JavaScript",
      })
      .set("Authorization", `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body.gyms).toHaveLength(1);
    expect(response.body.gyms).toEqual([
      expect.objectContaining({
        title: "JavaScript Gym",
      }),
    ]);
  });
});
