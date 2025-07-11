import { prisma } from '../src/lib/prisma'

async function seed(){
    await prisma.event.create({
        data: {
            id: '0bb633a1-aa0c-489b-9171-15b90abb6c14',
            title: 'Unite Summit',
            slug: 'unite-summit',
            details: 'Um evento p/ devs apaixonados(as) por código !',
            maximumAtendees: 120
        }
    })
}

seed().then(() => {
    console.log("Database seeded !")
    prisma.$disconnect()
})