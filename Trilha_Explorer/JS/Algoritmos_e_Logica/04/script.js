/*

    Solicitar o nome do aluno e as 3 notas
    do bimestre calcular a média daquele aluno.

    Se o aluno passou no bimestre, dar os parabéns.

    Se o aluno não passou no bimestre,
    motivar o aluno a dar o seu melhor
    na prova de recuperação

    Em ambos os casos, mostre uma mensagem com o nome do
    aluno e a nota.

*/

let name = prompt("Digite o seu nome: ")
let note1 = prompt('Digite a primeira nota: ')
let note2 = prompt('Digite a segunda nota: ')
let note3 = prompt('Digite a terceira nota: ')

let result = (Number(note1) + Number(note2) + Number(note3)) / 3

if(result > 6){
    alert('Você foi aprovado ' + name + " Parabéns !" + "Sua média foi de " + result.toFixed(2))
} else {
    alert("Você deve estudar mais " + name)
}