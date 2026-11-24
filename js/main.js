/* ==========================================================
   main.js - funções comuns a TODAS as páginas
   1) Armazenamento seguro   2) Acessibilidade (fonte/contraste)
   3) Funções temporais (saudação, loja aberta, ano do rodapé)
   4) Carrossel (botão pausar/continuar)
   ========================================================== */
'use strict';

/* ---------- 1) Armazenamento seguro ----------
   O localStorage pode estar bloqueado em alguns navegadores,
   por isso todo acesso passa por try/catch. */
const Armazenamento = {
  ler(chave, padrao = null) {
    try {
      const valor = localStorage.getItem(chave);
      return valor === null ? padrao : JSON.parse(valor);
    } catch (e) { return padrao; }
  },
  gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
  }
};

/* ---------- 2) Acessibilidade ---------- */
const TAMANHOS_FONTE = [100, 112.5, 125, 150]; // % do tamanho padrão
let indiceFonte = Armazenamento.ler('pa_fonte', 0);

// Aplica o tamanho de fonte salvo (afeta tudo que usa rem, incluindo o Bootstrap)
function aplicarFonte() {
  document.documentElement.style.fontSize = TAMANHOS_FONTE[indiceFonte] + '%';
  Armazenamento.gravar('pa_fonte', indiceFonte);
}

// Liga/desliga o modo de alto contraste
function aplicarContraste(ligado) {
  document.body.classList.toggle('alto-contraste', ligado);
  const botao = document.getElementById('btn-contraste');
  if (botao) botao.setAttribute('aria-pressed', String(ligado));
  Armazenamento.gravar('pa_contraste', ligado);
}

function iniciarAcessibilidade() {
  aplicarFonte();
  aplicarContraste(Armazenamento.ler('pa_contraste', false));

  const aumentar = document.getElementById('btn-aumentar');
  const diminuir = document.getElementById('btn-diminuir');
  const contraste = document.getElementById('btn-contraste');

  if (aumentar) aumentar.addEventListener('click', () => {
    indiceFonte = Math.min(indiceFonte + 1, TAMANHOS_FONTE.length - 1);
    aplicarFonte();
  });
  if (diminuir) diminuir.addEventListener('click', () => {
    indiceFonte = Math.max(indiceFonte - 1, 0);
    aplicarFonte();
  });
  if (contraste) contraste.addEventListener('click', () => {
    aplicarContraste(!document.body.classList.contains('alto-contraste'));
  });
}

/* ---------- 3) Funções temporais ---------- */

// Retorna "Bom dia", "Boa tarde" ou "Boa noite" conforme a hora
function saudacaoPorHora(hora) {
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Loja aberta de segunda a sábado, das 8h às 18h (domingo fechado)
function lojaAberta(data) {
  const dia = data.getDay(); // 0 = domingo
  const hora = data.getHours();
  return dia !== 0 && hora >= 8 && hora < 18;
}

function atualizarTempo() {
  const agora = new Date();

  const saudacao = document.getElementById('saudacao');
  if (saudacao) saudacao.textContent = saudacaoPorHora(agora.getHours()) + '!';

  const status = document.getElementById('status-loja');
  if (status) {
    const aberta = lojaAberta(agora);
    status.textContent = aberta ? 'Aberto agora (até 18h)' : 'Fechado agora (seg a sáb, 8h às 18h)';
  }

  // Ano do rodapé sempre atual
  document.querySelectorAll('.ano-atual').forEach(el => { el.textContent = agora.getFullYear(); });
}

/* ---------- 4) Carrossel: botão pausar/continuar ----------
   Requisito de acessibilidade: o usuário deve poder parar o movimento. */
function iniciarCarrossel() {
  const elemento = document.getElementById('carrosselPromo');
  const botao = document.getElementById('btn-pausar');
  if (!elemento || !botao || typeof bootstrap === 'undefined') return;

  const carrossel = bootstrap.Carousel.getOrCreateInstance(elemento);
  let pausado = false;

  function definir(estado) {
    pausado = estado;
    if (pausado) carrossel.pause(); else carrossel.cycle();
    botao.textContent = pausado ? 'Continuar apresentação' : 'Pausar apresentação';
    botao.setAttribute('aria-pressed', String(pausado));
  }

  botao.addEventListener('click', () => definir(!pausado));

  // Quem prefere menos movimento começa com o carrossel parado
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) definir(true);
}

document.addEventListener('DOMContentLoaded', () => {
  iniciarAcessibilidade();
  atualizarTempo();
  setInterval(atualizarTempo, 60 * 1000); // atualiza a cada minuto
  iniciarCarrossel();
});
