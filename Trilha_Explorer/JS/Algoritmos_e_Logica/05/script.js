/*
    Capture 10 itens para compor a lista de um supermercado.

    Após capturar os 10 items, imprima-os, separando por vírgulas

*/

let items = []

for(let item = 1; item <=10; item++){
    let itemName = prompt("Adicione o " + (item + 1) + " item: ")

    items[item] = itemName
}

alert(items)