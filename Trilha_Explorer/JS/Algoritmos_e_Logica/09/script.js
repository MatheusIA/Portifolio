/*

    Crie uma lista de pacientes

    Cada paciente deverá conter
        nome
        idade
        peso
        altura
    
    Escreva uma lista contendo o nome dos pacientes

*/

const patients = [
    {
        name: "Luiz",
        age: 20,
        weight: 100,
        height: 190
    },
    {
        name: "Alexandre",
        age: 30,
        weight: 70,
        height: 180
    },
    {
        name: "Maria",
        age: 20,
        weight: 80,
        height: 200
    }
]

let patientsName = []
for(let patients of patients){ //para um Paciente de Paciente, faça alguma coisa
    patientsName.push(patients.name)
} 

alert(patientsName)