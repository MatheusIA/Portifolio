/*
    Faça um programa que tenha um menu e apresente a seguinte mensagem: 

    Olá usuário! Digite a opção desejada

        1. Cadastrar um item na lista
        2. Mostrar itens cadastrados
        3. Sair do programa

    ---
    O programa deverá capturar o número digitado pelo usuário e mostrar o
    seguinte cenários: 

    Caso o usuário dígite 1, ele poderá cadastrar um item em uma lista
    Caso o usuário dígite 2, ele poderá ver os itens cadastrados
        Se não houver nenhum item cadastrado, mostra a mensagem:
            "Não existe itens cadastrados"
    Caso o usuário digite 3, a aplicação deverá ser encerrada.



*/
let option
let items = []

while (option != 3) {

    option = Number(prompt(`
    Olá usuário! Digite a opção desejada
    
        1. Cadastrar um item na lista
        2. Mostrar itens cadastrados
        3. Sair do programa
    `))

    if (option == 1) {
        items.push = prompt("Digite o nome do item")
       
    
    } else if (option == 2) {
        if (items.length = 0) {
            alert("Não existe itens cadastrados")

        } else {
            alert(items)
        }

    } else {
        alert("Saindo do programa !")
    }
}
