import { CommentWithAuthor } from "@/domain/forum/enterprise/entities/value-objects/comment-with-author";

export class CommentWithAuthorPresenter {
  static toHTTP(commentWithAutohor: CommentWithAuthor) {
    return {
      commentId: commentWithAutohor.commentId.toString(),
      authorId: commentWithAutohor.authorId.toString(),
      authorName: commentWithAutohor.author,
      content: commentWithAutohor.content,
      createdAt: commentWithAutohor.createdAt,
      updatedAt: commentWithAutohor.updateAt,
    };
  }
}
