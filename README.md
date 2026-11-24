# PetAmigo Petshop - Fase 2

Sistema web (front-end) de um petshop, desenvolvido por **Igor de Araujo Brancher** para a disciplina Fundamentos de Sistemas Web.
Tecnologias: HTML5, CSS3, Bootstrap 5.3 (via CDN) e JavaScript puro. Não há back-end: os dados ficam salvos no próprio navegador (localStorage).

## Estrutura de arquivos
```
index.html          Início (carrossel, categorias, como funciona a tele-busca)
acessorios.html     Produtos: acessórios
racoes.html         Produtos: rações
higiene.html        Produtos: higiene e limpeza
servicos.html       Serviços e valores
cadastro.html       Formulário de cadastro do cliente e do pet
agendamento.html    Escolha do serviço, método e data/horário
contato.html        Contato
css/style.css       Estilos próprios (sobre o Bootstrap)
js/main.js          Funções comuns: acessibilidade, funções temporais, carrossel
js/cadastro.js      Máscaras, validação de CPF e gravação do cadastro
js/agendamento.js   Calendário, horários, resumo e lista de agendamentos
img/                Imagens (SVG) dos produtos e do carrossel
```

## Funcionalidades
**CSS/Bootstrap e JavaScript**
- Menu responsivo (Bootstrap navbar) e layout em grade, que se adapta a celular e computador.
- Carrossel de destaques (Bootstrap) com botão para pausar/continuar.
- Funções temporais: saudação por horário (bom dia, boa tarde, boa noite), aviso "Aberto agora/Fechado agora" e ano do rodapé atualizado automaticamente.

**Cadastro do cliente e do pet** (`cadastro.html`)
- Cliente: nome, CPF, data de nascimento, sexo, telefone, e-mail, endereço completo e preferência de contato.
- Pet: nome, espécie, raça, idade (com unidade), porte, sexo, castrado, vacinas em dia e observações.
- Elementos usados: text, number, email, tel, date, radio, checkbox, select, textarea, placeholder, campos obrigatórios (required), pattern, minlength, min e max.
- Máscaras de CPF, telefone e CEP; validação real do CPF (dígitos verificadores); responsável deve ter 18 anos ou mais; busca de endereço pelo CEP (ViaCEP).

**Agendamento** (`agendamento.html`)
- Serviços: banho e tosa (um ou os dois; os dois juntos têm valor de combo).
- Atendimento: tele-busca (o pet é buscado e devolvido em casa) ou entrega no petshop. Para tele-busca, o endereço é exigido.
- Calendário (campo de data) de hoje até 60 dias, sem domingos, e horários de hora em hora, das 8h às 17h. Horários passados ou já reservados ficam indisponíveis.
- Resumo com valor total em tempo real, confirmação com número de protocolo e lista "Meus agendamentos" com opção de cancelar.

**Acessibilidade para deficientes visuais**
- Atributo `alt` com descrição detalhada em todas as imagens (audiodescrição).
- Botões A- e A+ para ampliar o texto e botão de alto contraste (preferências ficam salvas).
- Link "Pular para o conteúdo", `lang="pt-br"`, rótulos (`label`) em todos os campos, `aria-label`, regiões `aria-live` e `role="alert"` para avisos lidos por leitores de tela, foco visível no teclado e respeito a `prefers-reduced-motion`.

## Ajustes realizados em relação à fase 1
1. **Código organizado em arquivos:** o CSS e o JavaScript foram separados em `css/` e `js/`, e todo o código está comentado.
2. **Bootstrap:** substituiu a formatação manual do menu e das grades; o menu agora vira "hambúrguer" no celular.
3. **Tabela de serviços da fase 1 substituída por cartões**, mais legíveis em telas pequenas.
4. **Textos alternativos (`alt`) revisados:** de rótulos curtos ("Moletom para cães") para descrições do que aparece na imagem.
5. **Imagens com largura e altura definidas e carregamento tardio (`loading="lazy"`)**, evitando saltos de layout.
6. **Validação de formulários** com mensagens claras, foco no primeiro erro e bloqueio de dados inválidos (CPF, telefone, CEP, idade).
7. **Prevenção de problemas no agendamento:** domingos bloqueados, horários passados ocultos, conferência de horário duplicado antes de confirmar e erro de fuso horário evitado ao tratar datas.
8. **Segurança:** os dados digitados são exibidos com `textContent`, nunca como HTML, evitando injeção de código.
9. **Tolerância a falhas:** o acesso ao armazenamento do navegador e à API de CEP usa `try/catch`; se falharem, o site continua funcionando.
10. **Dados de contato atualizados** (endereço e e-mail) e conteúdo padronizado em todas as páginas.
11. Teste das funções de cálculo, máscaras, CPF, horários e saudação, com resultado correto em todos os casos testados.

## Como publicar (GitHub Pages)
Envie todos os arquivos para a raiz do repositório e ative em Settings > Pages > Deploy from a branch > `main` > `/ (root)`.

## Observações
- Imagens ilustrativas (SVG) criadas para o projeto. Podem ser trocadas por fotos reais em `img/`.
- O envio dos formulários é simulado: não há servidor, e os dados ficam apenas no navegador de quem usa.
