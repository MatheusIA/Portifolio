import request from "supertest";
import { app } from "@/app";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAndAuthenticateUser } from "@/utils/test/create-and-authenticate-user";
import { prisma } from "@/lib/prisma";

describe("Create Check-in (e2e)", () => {
  beforeAll(async () => {
    // Verificando se a nossa aplicação terminou de ser inicializada
    await app.ready();
  });

  afterAll(async () => {
    // Depois dos testes terminar, a aplicação deve se fechada
    await app.close();
  });

  it("should be able to create a check-in", async () => {
    const { token } = await createAndAuthenticateUser(app);

    const gym = await prisma.gym.create({
      data: {
        title: "JavaScript Gym",
        latitude: -21.417262,
        longitude: -45.9705647,
      },
    });

    const response = await request(app.server)
      .post(`/gyms/${gym.id}/check-ins`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        latitude: -21.417262,
        longitude: -45.9705647,
      });

    expect(response.statusCode).toEqual(201);
  });
});
