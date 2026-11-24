/* ==========================================================
   cadastro.js - formulário de cadastro do cliente e do pet
   1) Máscaras   2) Validação de CPF e idade   3) Busca de CEP
   4) Validação Bootstrap e gravação no navegador
   ========================================================== */
'use strict';

/* ---------- 1) Máscaras de digitação ---------- */
const somenteDigitos = (t) => t.replace(/\D/g, '');

function mascaraCPF(v) {
  const d = somenteDigitos(v).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, '$1.$2')
          .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1-$2');
}
function mascaraTelefone(v) {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}
function mascaraCEP(v) {
  return somenteDigitos(v).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

/* ---------- 2) Validações ---------- */

// Valida CPF pelos dígitos verificadores
function cpfValido(cpf) {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false; // rejeita 111.111.111-11 etc.
  const calcula = (tam) => {
    let soma = 0;
    for (let i = 0; i < tam; i++) soma += Number(d[i]) * (tam + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcula(9) === Number(d[9]) && calcula(10) === Number(d[10]);
}

// Calcula a idade (em anos) a partir de "AAAA-MM-DD"
function idadeEmAnos(dataISO) {
  const [a, m, d] = dataISO.split('-').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
  return idade;
}

// Define (ou limpa) a mensagem de erro personalizada de um campo
function definirErro(campo, mensagem) {
  campo.setCustomValidity(mensagem);
  const aviso = campo.parentElement.querySelector('.invalid-feedback');
  if (aviso && mensagem) aviso.textContent = mensagem;
}

/* ---------- 3) Busca de endereço pelo CEP (API ViaCEP) ----------
   Se a API falhar, o usuário simplesmente preenche à mão. */
async function buscarCEP(cep) {
  const digitos = somenteDigitos(cep);
  if (digitos.length !== 8) return;
  try {
    const resposta = await fetch('https://viacep.com.br/ws/' + digitos + '/json/');
    const dados = await resposta.json();
    if (dados.erro) return;
    document.getElementById('endereco').value = dados.logradouro || '';
    document.getElementById('bairro').value = dados.bairro || '';
    document.getElementById('cidade').value = dados.localidade || '';
    document.getElementById('uf').value = dados.uf || '';
    document.getElementById('numero').focus();
  } catch (e) { /* sem internet ou API fora do ar: ignora */ }
}

/* ---------- 4) Formulário ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cadastro');
  if (!form) return;

  const cpf = document.getElementById('cpf');
  const tel = document.getElementById('telefone');
  const cep = document.getElementById('cep');
  const nasc = document.getElementById('nascimento');

  // Data de nascimento não pode ser futura
  const hoje = new Date();
  const p2 = (n) => String(n).padStart(2, '0'); // usa o fuso local (toISOString usaria UTC)
  nasc.max = hoje.getFullYear() + '-' + p2(hoje.getMonth() + 1) + '-' + p2(hoje.getDate());

  // Aplica as máscaras enquanto a pessoa digita
  cpf.addEventListener('input', () => { cpf.value = mascaraCPF(cpf.value); definirErro(cpf, ''); });
  tel.addEventListener('input', () => { tel.value = mascaraTelefone(tel.value); });
  cep.addEventListener('input', () => { cep.value = mascaraCEP(cep.value); });
  cep.addEventListener('blur', () => buscarCEP(cep.value));
  nasc.addEventListener('input', () => definirErro(nasc, ''));

  form.addEventListener('submit', (evento) => {
    evento.preventDefault(); // nunca recarrega a página

    // Validações personalizadas (além das nativas: required, pattern, min, max...)
    definirErro(cpf, cpf.value && !cpfValido(cpf.value) ? 'CPF inválido. Confira os números.' : '');
    definirErro(nasc, nasc.value && idadeEmAnos(nasc.value) < 18 ? 'O responsável deve ter 18 anos ou mais.' : '');

    form.classList.add('was-validated'); // mostra os avisos do Bootstrap

    if (!form.checkValidity()) {
      // Leva o foco ao primeiro campo com problema
      const primeiro = form.querySelector(':invalid');
      if (primeiro) primeiro.focus();
      return;
    }

    // Monta o objeto com os dados do cliente e do pet
    const dados = new FormData(form);
    const cadastro = {
      cliente: {
        nome: dados.get('nome'), cpf: dados.get('cpf'), nascimento: dados.get('nascimento'),
        sexo: dados.get('sexo'), telefone: dados.get('telefone'), email: dados.get('email'),
        cep: dados.get('cep'), endereco: dados.get('endereco'), numero: dados.get('numero'),
        complemento: dados.get('complemento'), bairro: dados.get('bairro'),
        cidade: dados.get('cidade'), uf: dados.get('uf'),
        contato: dados.getAll('contato')
      },
      pet: {
        nome: dados.get('pet_nome'), especie: dados.get('pet_especie'), raca: dados.get('pet_raca'),
        idade: dados.get('pet_idade'), unidade: dados.get('pet_unidade'), porte: dados.get('pet_porte'),
        sexo: dados.get('pet_sexo'), castrado: dados.has('pet_castrado'),
        vacinas: dados.has('pet_vacinas'), observacoes: dados.get('pet_obs')
      },
      criadoEm: new Date().toISOString()
    };

    // Grava neste navegador (o agendamento reaproveita esses dados)
    const salvo = Armazenamento.gravar('pa_cadastro', cadastro);

    const aviso = document.getElementById('aviso-sucesso');
    aviso.textContent = salvo
      ? 'Cadastro realizado! ' + cadastro.cliente.nome + ' e ' + cadastro.pet.nome + ' já estão na nossa lista.'
      : 'Cadastro validado, mas seu navegador bloqueou o armazenamento local.';
    aviso.classList.remove('d-none');
    document.getElementById('link-agendar').classList.remove('d-none');
    aviso.focus();
    aviso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.reset();
    form.classList.remove('was-validated');
  });
});
