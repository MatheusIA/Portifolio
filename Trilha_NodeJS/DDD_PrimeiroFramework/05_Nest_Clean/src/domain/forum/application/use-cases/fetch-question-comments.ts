import { Either, left, right } from "@/core/either";
import { QuestionsCommentsRepository } from "../repositories/question-comments-repository";
import { Injectable } from "@nestjs/common";
import { CommentWithAuthor } from "../../enterprise/entities/value-objects/comment-with-author";

interface FetchQuestionCommentsUseCaseRequest {
  questionId: string;
  page: number;
}

type FetchQuestionCommentsUseCaseResponse = Either<
  null,
  {
    comments: CommentWithAuthor[];
  }
>;

@Injectable()
export class FetchQuestionCommentsUseCase {
  constructor(
    private questionCommentsRepository: QuestionsCommentsRepository,
  ) {}

  async execute({
    questionId,
    page,
  }: FetchQuestionCommentsUseCaseRequest): Promise<FetchQuestionCommentsUseCaseResponse> {
    const comments =
      await this.questionCommentsRepository.findManyByQuestionIdWithAuthor(
        questionId,
        {
          page,
        },
      );

    if (comments === null) {
      // Se não houver comentários, retorne um Left indicando que não foram encontrados comentários
      return left(null);
    }

    return right({
      comments,
    });
  }
}
