# Exemplo de WebAssembly para Programação Web

Exemplo prático de integração entre WebAssembly (Wasm) e JavaScript no navegador, desenvolvido para demonstração em aula de Programação Web.

O projeto aborda:
1. Chamada de funções exportadas do Wasm a partir do JavaScript.
2. Comparação de tempo de execução entre JS (V8 JIT) e WebAssembly (cálculo de Fibonacci e contagem de primos).
3. Manipulação direta de memória linear (`WebAssembly.Memory`) compartilhada com Canvas HTML5 (aplicação de filtros de imagem in-place).

---

## Estrutura dos Arquivos

- `index.html`: Interface com os controles de teste, benchmarks e visualizador do Canvas.
- `style.css`: Estilização da interface.
- `main.js`: Lógica de carregamento do binário Wasm, execução dos testes e manipulação de memória.
- `math.wat`: Código-fonte em WebAssembly Text Format (instruções da pilha).
- `math.wasm`: Binário compilado a partir do `math.wat`.
- `math.c`: Código equivalente em C para comparação de sintaxe.
- `build.js`: Script de compilação de `.wat` para `.wasm` via `wabt`.
- `wasm-base64.js`: Fallback que permite carregar o binário mesmo se o arquivo HTML for aberto diretamente pelo navegador (sem servidor HTTP).

---

## Como Rodar

### Com Python
No diretório do projeto, execute:
```bash
python -m http.server 8080
```
Acesse: [http://localhost:8080](http://localhost:8080)

### Com Node.js
```bash
npx serve .
```

---

## Como Recompilar o Código Wasm

Caso queira alterar as instruções no arquivo `math.wat`:

1. Edite `math.wat`.
2. Execute o comando:
   ```bash
   node build.js
   ```
3. O script regera o arquivo `math.wasm` atualizado.

---

## Conceitos Principais

### 1. Carregamento no JavaScript
O carregamento mais eficiente é feito via `WebAssembly.instantiateStreaming`, que baixa e compila o binário simultaneamente:

```javascript
const response = await fetch('math.wasm');
const { instance } = await WebAssembly.instantiateStreaming(response);

// Funções exportadas pelo módulo
const { add, fibonacci } = instance.exports;
console.log(add(10, 20));
```

### 2. Memória Compartilhada (`WebAssembly.Memory`)
O WebAssembly opera sobre um buffer de memória linear (um `ArrayBuffer`). O JavaScript pode criar visões tipadas (`Uint8Array`, `Uint8ClampedArray`, etc.) sobre o mesmo buffer para passar arrays ou buffers de imagem sem serialização em JSON ou cópias desnecessárias:

```javascript
// Acessa o buffer de memória exportado pelo módulo
const memoryBuffer = new Uint8Array(instance.exports.memory.buffer);

// Escreve os pixels da imagem a partir do offset 0
memoryBuffer.set(imageData.data, 0);

// Executa a função em Wasm que altera os bytes diretamente
instance.exports.applyGrayscale(0, imageData.data.length);

// Atualiza o canvas com os dados modificados
const result = new Uint8ClampedArray(instance.exports.memory.buffer, 0, imageData.data.length);
ctx.putImageData(new ImageData(result, width, height), 0, 0);
```

### 3. JavaScript vs WebAssembly
- **JavaScript**: Linguagem dinâmica de alto nível, ideal para manipular a árvore DOM, eventos de interface e regras de negócio da web.
- **WebAssembly**: Formato binário fortemente tipado e de baixo nível, ideal para tarefas com uso intensivo de CPU (jogos, renderização gráfica, processamento de áudio/vídeo, criptografia e cálculos matemáticos pesados).
