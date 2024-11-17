import http from 'node:http' //quando são modulos internos do proprio node

import { json } from './middlewares/json.js'
import { routes } from './routes.js'
import { extractQueryParams } from './utils/extract-query-params.js'

//GET, POST, PUT, PATCH, DELETE

// GET: Utilizado para buscar umainformação
// POST: Criar uma recurso no back-end
// PUT: Atualizar um recurso no back-end
// PATCH: Atualizar uma informação especifica de um recurso no back-end.
// DELETE: Deletar um recurso no back-end.

//Cabeçalhos (Requisição/resposta) => Metadados
//UUID => Unique Universal ID

// Query Parameters: URL Stateful => Filtros, paginação, não-obrigatórios //http://localhost:3333/users?userId=1 (Fica na URL)
// Route Parameters: Identificação de Recurso //http://localhost:3333/users/1 (Fica na URL)
// Request Body: Envio de informações de um formulário 


const server = http.createServer(async (req, res) => {
    const { method, url } = req

    
    await json(req, res)
    
    const route = routes.find(route => {

        return route.method === method && route.path.test(url)
    })

    if(route){
        const routeParams = req.url.match(route.path)

        const { query, ...params} = routeParams.groups

        req.params = params
        req.query = query ? extractQueryParams(query) : {}


        return route.handler(req, res)
    }    

    return res.writeHead(404).end()
})

server.listen(3333)
