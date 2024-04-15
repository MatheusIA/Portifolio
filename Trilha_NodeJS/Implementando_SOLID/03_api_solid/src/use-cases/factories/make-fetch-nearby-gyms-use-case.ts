import { FetchNearbyGymUseCase } from "../fetch-nearby-gyms";
import { PrismaGymsRepository } from "@/repositories/prisma/prisma-gyms-repository";

export function makeFetchNearbyGymUseCase() {
  const gymsRepository = new PrismaGymsRepository();
  const useCase = new FetchNearbyGymUseCase(gymsRepository);

  return useCase;
}
