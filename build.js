import wabtModule from 'wabt';
import fs from 'fs';

async function build() {
  const wabt = await wabtModule();
  const watSource = fs.readFileSync('math.wat', 'utf8');

  const parsed = wabt.parseWat('math.wat', watSource);
  const { buffer } = parsed.toBinary({ log: true, write_debug_names: true });

  fs.writeFileSync('math.wasm', Buffer.from(buffer));
  
  // Base64 fallback (para compatibilidade total caso aberto diretamente como arquivo)
  const base64Wasm = Buffer.from(buffer).toString('base64');
  fs.writeFileSync('wasm-base64.js', `// Base64 fallback para carregar o WebAssembly até em ambientes sem servidor HTTP ativo\nwindow.WASM_BASE64 = "${base64Wasm}";\n`);

  console.log('✅ math.wasm e wasm-base64.js gerados com sucesso! Tamanho:', buffer.length, 'bytes');
}

build().catch(console.error);
