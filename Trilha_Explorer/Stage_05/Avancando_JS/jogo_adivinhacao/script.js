const screen1 = document.querySelector(".screen1")
const screen2 = document.querySelector(".screen2")
const btnTry = document.querySelector("#btnTry")
const btnReset = document.querySelector("#btnReset")

let randomNumber = Math.round(Math.random() * 10) //Math.round Arredonda tanto para baixo, quanto para cima
let xAttempts = 1;

//Eventos
btnTry.addEventListener('click', handleTryClick) //A função handleTryClick, só vai ser executada, depois de recber o click, por isso é callback
btnReset.addEventListener('click', handleResetClick)
document.addEventListener('keypress', function(e) {
    if(e.key == 'Enter' && screen1.classList.contains('hide')){
        handleResetClick()
    }
})

//função callback
function handleTryClick(event) {
    event.preventDefault() //não faça o padrão do evento
    
    const inputNumber = document.querySelector("#inputNumber")

    if(Number(inputNumber.value) == randomNumber){
        toggleScreen()

        screen2
        .querySelector(".screen2 h2")
        .innerText = `Acertou em ${xAttempts} tentativas`

        console.log(`Acertou em ${xAttempts} tentativas`)
    }

    inputNumber.value = ""
    xAttempts++

}

function handleResetClick() {
    toggleScreen()
    xAttempts = 1
    randomNumber = Math.round(Math.random() * 10)
}

//toggle = caso tenha na screen1 ele tira, caso não tenha ele adiciona
function toggleScreen(){
    screen1.classList.toggle("hide") //hide está fazendo sumir a tela
    screen2.classList.toggle("hide")
}