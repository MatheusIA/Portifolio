/*    
    Capturar 2 números
    e fazr as operações matemáticas
    de soma, subtração, multiplicação, divisão e resto da divisão. 
    
    E para cada operação, mostrar um alerta com o resultado.

*/

let firstNumber = prompt('Digite o primeiro número: ')
let secondNumber = prompt('Digite o segundo número: ')

firstNumber = Number(firstNumber)
secondNumber = Number(secondNumber)

const sum = firstNumber + secondNumber
const sub = firstNumber - secondNumber
const mult = firstNumber * secondNumber
const div = firstNumber / secondNumber
const restDiv = firstNumber % secondNumber

alert('Resultado da soma: ' + sum)
alert('Resultado da subtração: ' + sub)
alert('Resultado da multiplicação: ' + mult)
alert('Resultado da divisão: ' + div)
alert('Resultado do resto da divisão: ' + restDiv)