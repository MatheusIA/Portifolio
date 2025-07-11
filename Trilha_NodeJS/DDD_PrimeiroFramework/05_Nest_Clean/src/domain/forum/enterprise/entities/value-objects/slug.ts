export class Slug {
  public value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(slug: string) {
    return new Slug(slug);
  }

  /**
   * Receives a string and normalize it as a slug
   *
   * Example: " An example title" => "an-example-title"
   *
   * @param text { string }
   */
  static createFromText(text: string) {
    const slugText = text
      .normalize("NFKD")
      .toLowerCase()
      .trim() // retirando espaçamento das laterais caso exista
      .replace(/\s+/g, "-") // o S pega os espaços em branco, e o G é para pegar todos os espaços em branco e não somente o primeiro
      .replace(/[^\w-]+/g, "") // Pegando tudo que não são palavras
      .replace(/_/g, "-") // Pegando o que é underline e subistituindo por hifem
      .replace(/--+/g, "-") // Caso ficou dois hifens colados um ao outro, vai substituir por um só
      .replace(/-$/g, ""); // Se no final da string ficar com hifen, vai ser substituido por nada

    return new Slug(slugText);
  }
}
