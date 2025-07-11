import { DomainEvent } from "@/core/events/domain-event";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Question } from "../question";

export class QuestionBestAnswerChosenEvent implements DomainEvent {
  public ocurredAt: Date;
  public question: Question;
  public bestAnsweredId: UniqueEntityID;

  constructor(question: Question, bestAnsweredId: UniqueEntityID) {
    this.question = question;
    this.bestAnsweredId = bestAnsweredId;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.question.id;
  }
}
