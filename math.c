// math.c - Código equivalente em Linguagem C
// Este arquivo serve para ilustrar como código C é compilado para WebAssembly via Emscripten ou Clang

#define EMSCRIPTEN_KEEPALIVE __attribute__((used))

// 1. Função Básica: Soma
EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
    return a + b;
}

// 2. Função Recursiva: Fibonacci
EMSCRIPTEN_KEEPALIVE
int fibonacci(int n) {
    if (n < 2) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 3. Verificação de Número Primo
EMSCRIPTEN_KEEPALIVE
int isPrime(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return 0;
    }
    return 1;
}

// 4. Contar Primos até N
EMSCRIPTEN_KEEPALIVE
int countPrimes(int limit) {
    int count = 0;
    for (int i = 2; i <= limit; i++) {
        if (isPrime(i)) {
            count++;
        }
    }
    return count;
}

// 5. Filtro Grayscale manipulando buffer RGBA na memória
EMSCRIPTEN_KEEPALIVE
void applyGrayscale(unsigned char* pixels, int length) {
    for (int i = 0; i < length; i += 4) {
        unsigned char r = pixels[i];
        unsigned char g = pixels[i + 1];
        unsigned char b = pixels[i + 2];
        unsigned char gray = (unsigned char)((r * 299 + g * 587 + b * 114) / 1000);
        pixels[i] = gray;
        pixels[i + 1] = gray;
        pixels[i + 2] = gray;
        // pixels[i + 3] é o canal Alpha (transparência), mantido inalterado
    }
}

// 6. Filtro Inverter Cores
EMSCRIPTEN_KEEPALIVE
void invertColors(unsigned char* pixels, int length) {
    for (int i = 0; i < length; i += 4) {
        pixels[i] = 255 - pixels[i];
        pixels[i + 1] = 255 - pixels[i + 1];
        pixels[i + 2] = 255 - pixels[i + 2];
    }
}
