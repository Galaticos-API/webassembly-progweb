// main.js - Integração de WebAssembly com JavaScript para demonstração em aula

let wasmInstance = null;
let wasmExports = null;
let wasmMemory = null;

// ==============================================================================
// 1. Carregamento do WebAssembly
// ==============================================================================

async function initWebAssembly() {
  const statusEl = document.getElementById('wasm-status');
  
  try {
    if (typeof WebAssembly.instantiateStreaming === 'function' && location.protocol.startsWith('http')) {
      const response = await fetch('math.wasm');
      const { instance } = await WebAssembly.instantiateStreaming(response);
      wasmInstance = instance;
    } else if (location.protocol.startsWith('http')) {
      const response = await fetch('math.wasm');
      const bytes = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes);
      wasmInstance = instance;
    } else {
      // Fallback base64 para caso o arquivo seja aberto via file://
      if (window.WASM_BASE64) {
        const binaryString = atob(window.WASM_BASE64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const { instance } = await WebAssembly.instantiate(bytes.buffer);
        wasmInstance = instance;
      } else {
        throw new Error('Inicie um servidor HTTP local para carregar o arquivo .wasm');
      }
    }

    wasmExports = wasmInstance.exports;
    wasmMemory = wasmExports.memory;

    statusEl.innerHTML = `
      <span class="status-indicator active"></span>
      <span>Wasm carregado (${wasmMemory.buffer.byteLength / 1024} KB memória)</span>
    `;
    statusEl.className = 'status-badge success';
    
    document.querySelectorAll('.wasm-btn').forEach(btn => btn.disabled = false);
    initCanvas();

  } catch (error) {
    console.error('Erro ao carregar WebAssembly:', error);
    statusEl.innerHTML = `
      <span class="status-indicator"></span>
      <span>Erro ao carregar Wasm: ${error.message}</span>
    `;
  }
}

// ==============================================================================
// 2. Implementações em JavaScript Puro (para o benchmark comparativo)
// ==============================================================================

const JSMath = {
  add(a, b) {
    return a + b;
  },

  fibonacci(n) {
    if (n < 2) return n;
    return JSMath.fibonacci(n - 1) + JSMath.fibonacci(n - 2);
  },

  isPrime(n) {
    if (n < 2) return 0;
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return 0;
    }
    return 1;
  },

  countPrimes(limit) {
    let count = 0;
    for (let i = 2; i <= limit; i++) {
      if (JSMath.isPrime(i)) {
        count++;
      }
    }
    return count;
  },

  applyGrayscale(pixels, length) {
    for (let i = 0; i < length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const gray = ((r * 299 + g * 587 + b * 114) / 1000) | 0;
      pixels[i] = gray;
      pixels[i + 1] = gray;
      pixels[i + 2] = gray;
    }
  },

  invertColors(pixels, length) {
    for (let i = 0; i < length; i += 4) {
      pixels[i] = 255 - pixels[i];
      pixels[i + 1] = 255 - pixels[i + 1];
      pixels[i + 2] = 255 - pixels[i + 2];
    }
  }
};

// ==============================================================================
// 3. Demo 1: Operação Básica (Soma)
// ==============================================================================

function runAddDemo() {
  const a = parseInt(document.getElementById('add-a').value, 10) || 0;
  const b = parseInt(document.getElementById('add-b').value, 10) || 0;

  const result = wasmExports.add(a, b);

  const output = document.getElementById('add-result');
  output.innerHTML = `
    <div class="result-box">
      <span class="result-number">${result}</span>
      <div class="result-meta">
        <code>wasmExports.add(${a}, ${b})</code> &rarr; <strong>${result}</strong>
      </div>
    </div>
  `;
}

// ==============================================================================
// 4. Demo 2 & 3: Benchmarks Comparativos
// ==============================================================================

async function runFibonacciBenchmark() {
  const inputEl = document.getElementById('fib-n');
  const n = parseInt(inputEl.value, 10) || 38;
  const resultCard = document.getElementById('fib-benchmark-result');
  const btn = document.getElementById('btn-run-fib');

  if (n > 44) {
    resultCard.innerHTML = `
      <div class="placeholder-box" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.4);">
        <strong>Valor muito alto (N = ${n}):</strong><br>
        O algoritmo implementado é o <em>Fibonacci recursivo puro</em> com complexidade exponencial <strong>O(2^N)</strong>.<br>
        Para N = ${n}, são necessárias mais de <strong>44 trilhões de chamadas de função</strong>, o que levaria várias horas e travaria a aba do navegador.<br>
        <span style="color: var(--text-muted); display: block; margin-top: 6px;">Por favor, utilize valores entre <strong>30 e 42</strong> para testes em tempo real.</span>
      </div>
    `;
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Processando...';
  resultCard.innerHTML = `<div class="placeholder-box">Calculando Fibonacci(n = ${n})...</div>`;

  await new Promise(r => setTimeout(r, 40));

  // Execução no Wasm
  const t0Wasm = performance.now();
  const resWasm = wasmExports.fibonacci(n);
  const t1Wasm = performance.now();
  const wasmTime = t1Wasm - t0Wasm;

  // Execução no JS
  const t0JS = performance.now();
  const resJS = JSMath.fibonacci(n);
  const t1JS = performance.now();
  const jsTime = t1JS - t0JS;

  const speedup = (jsTime / wasmTime).toFixed(2);

  renderBenchmarkResult(resultCard, {
    title: `Fibonacci(${n}) = ${resWasm.toLocaleString()}`,
    wasmTime,
    jsTime,
    speedup,
    isWasmFaster: wasmTime <= jsTime
  });

  btn.disabled = false;
  btn.textContent = 'Executar Teste de Fibonacci';
}

async function runPrimesBenchmark() {
  const limit = parseInt(document.getElementById('primes-limit').value, 10) || 200000;
  const resultCard = document.getElementById('primes-benchmark-result');
  const btn = document.getElementById('btn-run-primes');

  btn.disabled = true;
  btn.textContent = 'Processando...';
  resultCard.innerHTML = `<div class="placeholder-box">Verificando primos até ${limit.toLocaleString()}...</div>`;

  await new Promise(r => setTimeout(r, 40));

  const t0Wasm = performance.now();
  const resWasm = wasmExports.countPrimes(limit);
  const t1Wasm = performance.now();
  const wasmTime = t1Wasm - t0Wasm;

  const t0JS = performance.now();
  const resJS = JSMath.countPrimes(limit);
  const t1JS = performance.now();
  const jsTime = t1JS - t0JS;

  const speedup = (jsTime / wasmTime).toFixed(2);

  renderBenchmarkResult(resultCard, {
    title: `Total de primos até ${limit.toLocaleString()}: ${resWasm.toLocaleString()}`,
    wasmTime,
    jsTime,
    speedup,
    isWasmFaster: wasmTime <= jsTime
  });

  btn.disabled = false;
  btn.textContent = 'Executar Teste de Primos';
}

function renderBenchmarkResult(container, data) {
  const maxTime = Math.max(data.jsTime, data.wasmTime, 0.001);
  const wasmPercent = Math.min(100, Math.max(5, (data.wasmTime / maxTime) * 100));
  const jsPercent = Math.min(100, Math.max(5, (data.jsTime / maxTime) * 100));

  container.innerHTML = `
    <div class="benchmark-result">
      <div class="benchmark-header">
        <strong>${data.title}</strong>
        <span class="benchmark-badge">
          ${data.isWasmFaster ? `Wasm ${data.speedup}x mais rápido` : `JS equivalente (${data.speedup}x)`}
        </span>
      </div>

      <div class="bar-row">
        <div class="bar-info">
          <span>WebAssembly:</span>
          <span>${data.wasmTime.toFixed(2)} ms</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill-wasm" style="width: ${wasmPercent}%"></div>
        </div>
      </div>

      <div class="bar-row">
        <div class="bar-info">
          <span>JavaScript (V8):</span>
          <span>${data.jsTime.toFixed(2)} ms</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill-js" style="width: ${jsPercent}%"></div>
        </div>
      </div>
    </div>
  `;
}

// ==============================================================================
// 5. Demo 4: Canvas e Memória Compartilhada
// ==============================================================================

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 240;
let originalImageData = null;

function initCanvas() {
  const canvas = document.getElementById('demo-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  drawSampleScene(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  originalImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const totalBytes = CANVAS_WIDTH * CANVAS_HEIGHT * 4;
  const el = document.getElementById('memory-meta-info');
  if (el) {
    el.textContent = `Tamanho da imagem: ${totalBytes.toLocaleString()} bytes (360x240 px, 4 canais RGBA)`;
  }
}

function drawSampleScene(ctx, w, h) {
  // Gradiente de fundo
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(0.5, '#334155');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Figuras geométricas simples para contraste de cores
  const colors = ['#38bdf8', '#fb7185', '#a3e635', '#facc15', '#c084fc'];
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    const x = (i * 43) % w;
    const y = (i * 37) % h;
    const radius = 20 + (i * 3) % 25;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.8;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WebAssembly & Canvas', w / 2, h / 2);

  ctx.font = '400 13px Inter, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Demonstração de Memória Compartilhada', w / 2, h / 2 + 25);
}

function resetCanvas() {
  const canvas = document.getElementById('demo-canvas');
  const ctx = canvas.getContext('2d');
  if (originalImageData) {
    ctx.putImageData(originalImageData, 0, 0);
  }
  document.getElementById('canvas-filter-stats').textContent = 'Imagem original restaurada.';
}

function applyWasmFilter(filterName) {
  const canvas = document.getElementById('demo-canvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const pixelBytes = imageData.data;
  const totalBytes = pixelBytes.length;

  const t0 = performance.now();

  // 1. Acesso à memória linear do Wasm
  const wasmBuffer = new Uint8Array(wasmMemory.buffer);

  // 2. Copia os pixels para o início da memória do módulo
  wasmBuffer.set(pixelBytes, 0);

  // 3. Executa a função do Wasm que altera o buffer in-place
  if (filterName === 'grayscale') {
    wasmExports.applyGrayscale(0, totalBytes);
  } else if (filterName === 'invert') {
    wasmExports.invertColors(0, totalBytes);
  }

  // 4. Aplica os dados modificados diretamente no Canvas
  const processed = new Uint8ClampedArray(wasmMemory.buffer, 0, totalBytes);
  ctx.putImageData(new ImageData(processed, CANVAS_WIDTH, CANVAS_HEIGHT), 0, 0);

  const t1 = performance.now();
  document.getElementById('canvas-filter-stats').textContent = 
    `Filtro ${filterName} aplicado via Wasm em ${(t1 - t0).toFixed(3)} ms.`;
}

function applyJSFilter(filterName) {
  const canvas = document.getElementById('demo-canvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const pixelBytes = imageData.data;
  const totalBytes = pixelBytes.length;

  const t0 = performance.now();

  if (filterName === 'grayscale') {
    JSMath.applyGrayscale(pixelBytes, totalBytes);
  } else if (filterName === 'invert') {
    JSMath.invertColors(pixelBytes, totalBytes);
  }

  ctx.putImageData(imageData, 0, 0);
  const t1 = performance.now();
  document.getElementById('canvas-filter-stats').textContent = 
    `Filtro ${filterName} aplicado via JS em ${(t1 - t0).toFixed(3)} ms.`;
}

// ==============================================================================
// 6. Abas de Código
// ==============================================================================

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  const activePane = document.getElementById(`tab-${tabId}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activePane) activePane.classList.add('active');
}

// ==============================================================================
// 7. Inicialização
// ==============================================================================

window.addEventListener('DOMContentLoaded', () => {
  initWebAssembly();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('btn-add')?.addEventListener('click', runAddDemo);
  document.getElementById('btn-run-fib')?.addEventListener('click', runFibonacciBenchmark);
  document.getElementById('btn-run-primes')?.addEventListener('click', runPrimesBenchmark);

  document.getElementById('btn-filter-gray-wasm')?.addEventListener('click', () => applyWasmFilter('grayscale'));
  document.getElementById('btn-filter-invert-wasm')?.addEventListener('click', () => applyWasmFilter('invert'));
  document.getElementById('btn-filter-gray-js')?.addEventListener('click', () => applyJSFilter('grayscale'));
  document.getElementById('btn-filter-invert-js')?.addEventListener('click', () => applyJSFilter('invert'));
  document.getElementById('btn-reset-canvas')?.addEventListener('click', resetCanvas);
});
