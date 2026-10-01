(module
  ;; Aloca 10 páginas de 64 KB (640 KB no total) de memória linear compartilhada
  (memory (export "memory") 10)

  ;; 1. Soma simples de inteiros de 32 bits
  (func $add (export "add") (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )

  ;; 2. Fibonacci recursivo
  (func $fibonacci (export "fibonacci") (param $n i32) (result i32)
    local.get $n
    i32.const 2
    i32.lt_s
    if (result i32)
      local.get $n
    else
      local.get $n
      i32.const 1
      i32.sub
      call $fibonacci

      local.get $n
      i32.const 2
      i32.sub
      call $fibonacci

      i32.add
    end
  )

  ;; 3. Verificação de número primo
  (func $isPrime (export "isPrime") (param $n i32) (result i32)
    (local $i i32)
    
    local.get $n
    i32.const 2
    i32.lt_s
    if
      i32.const 0
      return
    end

    i32.const 2
    local.set $i

    (block $break
      (loop $continue
        ;; Encerra o loop se i * i > n
        local.get $i
        local.get $i
        i32.mul
        local.get $n
        i32.gt_s
        br_if $break

        ;; Retorna 0 se for divisível
        local.get $n
        local.get $i
        i32.rem_s
        i32.eqz
        if
          i32.const 0
          return
        end

        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $continue
      )
    )
    i32.const 1
  )

  ;; 4. Contagem de primos até o limite
  (func $countPrimes (export "countPrimes") (param $limit i32) (result i32)
    (local $count i32)
    (local $i i32)

    i32.const 0
    local.set $count

    i32.const 2
    local.set $i

    (block $break
      (loop $continue
        local.get $i
        local.get $limit
        i32.gt_s
        br_if $break

        local.get $i
        call $isPrime
        if
          local.get $count
          i32.const 1
          i32.add
          local.set $count
        end

        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $continue
      )
    )
    local.get $count
  )

  ;; 5. Filtro de escala de cinza sobre os bytes da imagem RGBA na memória
  (func $applyGrayscale (export "applyGrayscale") (param $offset i32) (param $length i32)
    (local $i i32)
    (local $r i32)
    (local $g i32)
    (local $b i32)
    (local $gray i32)
    (local $end i32)

    local.get $offset
    local.get $length
    i32.add
    local.set $end

    local.get $offset
    local.set $i

    (block $break
      (loop $continue
        local.get $i
        local.get $end
        i32.ge_u
        br_if $break

        ;; Lê canais R, G e B
        local.get $i
        i32.load8_u
        local.set $r

        local.get $i
        i32.const 1
        i32.add
        i32.load8_u
        local.set $g

        local.get $i
        i32.const 2
        i32.add
        i32.load8_u
        local.set $b

        ;; (R * 299 + G * 587 + B * 114) / 1000
        local.get $r
        i32.const 299
        i32.mul
        local.get $g
        i32.const 587
        i32.mul
        i32.add
        local.get $b
        i32.const 114
        i32.mul
        i32.add
        i32.const 1000
        i32.div_u
        local.set $gray

        ;; Escreve de volta nos 3 canais
        local.get $i
        local.get $gray
        i32.store8

        local.get $i
        i32.const 1
        i32.add
        local.get $gray
        i32.store8

        local.get $i
        i32.const 2
        i32.add
        local.get $gray
        i32.store8

        ;; Pula 4 bytes (R, G, B, A)
        local.get $i
        i32.const 4
        i32.add
        local.set $i

        br $continue
      )
    )
  )

  ;; 6. Inversão de cores (255 - valor)
  (func $invertColors (export "invertColors") (param $offset i32) (param $length i32)
    (local $i i32)
    (local $end i32)

    local.get $offset
    local.get $length
    i32.add
    local.set $end

    local.get $offset
    local.set $i

    (block $break
      (loop $continue
        local.get $i
        local.get $end
        i32.ge_u
        br_if $break

        local.get $i
        i32.const 255
        local.get $i
        i32.load8_u
        i32.sub
        i32.store8

        local.get $i
        i32.const 1
        i32.add
        i32.const 255
        local.get $i
        i32.const 1
        i32.add
        i32.load8_u
        i32.sub
        i32.store8

        local.get $i
        i32.const 2
        i32.add
        i32.const 255
        local.get $i
        i32.const 2
        i32.add
        i32.load8_u
        i32.sub
        i32.store8

        local.get $i
        i32.const 4
        i32.add
        local.set $i

        br $continue
      )
    )
  )
)