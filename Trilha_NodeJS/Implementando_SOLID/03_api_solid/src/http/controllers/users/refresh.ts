import { FastifyRequest, FastifyReply } from "fastify";

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  await request.jwtVerify({ onlyCookie: true });

  const { role } = request.user;

  const token = await reply.jwtSign(
    { role },
    {
      sign: {
        sub: request.user.sub,
      },
    },
  );

  const refreshtoken = await reply.jwtSign(
    { role },
    {
      sign: {
        sub: request.user.sub,
        expiresIn: "7d",
      },
    },
  );

  return reply
    .setCookie("refreshToken", refreshtoken, {
      path: "/",
      secure: true, // Define que o cookie vai ser encriptado através do HTTPs
      sameSite: true, // Define que esse cookie só vai ser acessado dentro desse mesmo dominio
      httpOnly: true, // Define que só vai conseguir acessar o RefrresToken pelo back end, e não pelo front end.
    })
    .status(200)
    .send({
      token,
    });
}
