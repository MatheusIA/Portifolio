// Readable Streams / Writeble Streams

// No Node, toda porta de entrada e saída é automaticamente uma Streams
// import process from 'node:process'

// process.stdin //Estou lendo o que está chegando
// .pipe(process.stdout) // Estou escrevendo  //Tudo que eu estou recebendo como entrada, estou encaminhando para saida, através do "pipe"

import { Readable, Writable, Transform } from 'node:stream'

class OneToHundredStream extends Readable {
    index = 1

    _read() {
        const i = this.index++

        setTimeout(() => {
            if(i > 100){
                this.push(null)
    
            } else {
                const buf = Buffer.from(String(i))
    
                this.push(buf)
            }
        }, 1000)
    }
}

class MultyplyByTenStream extends Writable {
    _write(chunk, encoding, callback) {
        console.log(Number(chunk.toString()) * 10)
        callback()
    }
}

class InverseNumberStream extends Transform {
    _transform(chunk, encoding, callback){
        const transformed = Number(chunk.toString()) * -1

        callback(null, Buffer.from(String(transformed)))
    }
}

new OneToHundredStream() //Streams de leitura
    .pipe(new InverseNumberStream()) // Streams de transformação
    .pipe(new MultyplyByTenStream()) // Streams de escrita, feitas para processar dados