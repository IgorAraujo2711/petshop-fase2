/* ==========================================================
   agendamento.js - escolha do serviço, método e data/horário
   1) Tabela de preços   2) Calendário e horários
   3) Resumo em tempo real   4) Envio e lista de agendamentos
   ========================================================== */
'use strict';

/* ---------- 1) Dados do negócio ---------- */
const PRECO_BANHO = 50;
const PRECO_TOSA = 60;
const PRECO_COMBO = 100;      // banho + tosa juntos
const TAXA_TELEBUSCA = 20;    // busca e entrega em casa
const HORARIOS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DIAS_ANTECEDENCIA_MAX = 60;

const dinheiro = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Converte "AAAA-MM-DD" em Date no fuso local (evita erro de um dia)
function dataLocal(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
// Converte Date em "AAAA-MM-DD" usando o fuso local
function paraISO(data) {
  const p = (n) => String(n).padStart(2, '0');
  return data.getFullYear() + '-' + p(data.getMonth() + 1) + '-' + p(data.getDate());
}
function formatarData(iso) {
  return dataLocal(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

// Calcula o valor conforme serviços marcados e método escolhido
function calcularTotal(banho, tosa, metodo) {
  let total = 0;
  if (banho && tosa) total = PRECO_COMBO;
  else if (banho) total = PRECO_BANHO;
  else if (tosa) total = PRECO_TOSA;
  if (total > 0 && metodo === 'telebusca') total += TAXA_TELEBUSCA;
  return total;
}

// Lista de horários livres para uma data (remove passados e já reservados)
function horariosDisponiveis(iso, reservas, agora = new Date()) {
  const ehHoje = iso === paraISO(agora);
  return HORARIOS.map((h) => {
    const hora = Number(h.slice(0, 2));
    const passou = ehHoje && hora <= agora.getHours();
    const ocupado = reservas.some((r) => r.data === iso && r.horario === h);
    return { horario: h, livre: !passou && !ocupado };
  });
}

/* ---------- Interface ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-agendamento');
  if (!form) return;

  const chkBanho = document.getElementById('srv-banho');
  const chkTosa = document.getElementById('srv-tosa');
  const erroServico = document.getElementById('erro-servico');
  const erroMetodo = document.getElementById('erro-metodo');
  const campoEndereco = document.getElementById('bloco-endereco');
  const inputEndereco = document.getElementById('ag-endereco');
  const inputData = document.getElementById('ag-data');
  const gradeHorarios = document.getElementById('grade-horarios');
  const erroHorario = document.getElementById('erro-horario');
  const avisoSucesso = document.getElementById('aviso-agendamento');

  let reservas = Armazenamento.ler('pa_agendamentos', []);

  const metodoAtual = () => (form.querySelector('input[name="metodo"]:checked') || {}).value || '';
  const horarioAtual = () => (form.querySelector('input[name="horario"]:checked') || {}).value || '';

  /* --- Calendário: limites de data (hoje até 60 dias) --- */
  const hoje = new Date();
  const limite = new Date();
  limite.setDate(hoje.getDate() + DIAS_ANTECEDENCIA_MAX);
  inputData.min = paraISO(hoje);
  inputData.max = paraISO(limite);

  /* --- Preenche dados salvos no cadastro, se existirem --- */
  const cadastro = Armazenamento.ler('pa_cadastro');
  const dica = document.getElementById('dica-cadastro');
  if (cadastro) {
    document.getElementById('ag-nome').value = cadastro.cliente.nome;
    document.getElementById('ag-telefone').value = cadastro.cliente.telefone;
    document.getElementById('ag-pet').value = cadastro.pet.nome;
    inputEndereco.value = [cadastro.cliente.endereco, cadastro.cliente.numero, cadastro.cliente.bairro,
      cadastro.cliente.cidade].filter(Boolean).join(', ');
    dica.textContent = 'Preenchemos seus dados com base no cadastro. Confira antes de confirmar.';
  } else {
    dica.innerHTML = 'Ainda não tem cadastro? <a href="cadastro.html">Cadastre-se primeiro</a> e seus dados serão preenchidos aqui.';
  }

  /* --- Gera os botões de horário para a data escolhida --- */
  function montarHorarios() {
    gradeHorarios.innerHTML = '';
    erroHorario.classList.add('d-none');
    if (!inputData.value) {
      gradeHorarios.textContent = 'Escolha uma data para ver os horários.';
      return;
    }
    // Domingo: loja fechada
    if (dataLocal(inputData.value).getDay() === 0) {
      inputData.setCustomValidity('Não atendemos aos domingos. Escolha de segunda a sábado.');
      gradeHorarios.textContent = 'Não atendemos aos domingos.';
      atualizarResumo();
      return;
    }
    inputData.setCustomValidity('');
    const lista = horariosDisponiveis(inputData.value, reservas);
    if (!lista.some((i) => i.livre)) {
      gradeHorarios.textContent = 'Não há horários livres nesta data. Escolha outro dia.';
    }
    lista.forEach((item, i) => {
      const col = document.createElement('div');
      col.className = 'col-4 col-sm-3';
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.className = 'btn-check'; radio.name = 'horario';
      radio.id = 'hor-' + i; radio.value = item.horario; radio.disabled = !item.livre;
      radio.addEventListener('change', atualizarResumo);
      const rotulo = document.createElement('label');
      rotulo.className = 'btn btn-horario w-100'; rotulo.htmlFor = radio.id;
      rotulo.textContent = item.horario;
      if (!item.livre) rotulo.title = 'Horário indisponível';
      col.append(radio, rotulo);
      gradeHorarios.appendChild(col);
    });
    atualizarResumo();
  }

  /* --- Resumo em tempo real (coluna da direita) --- */
  function atualizarResumo() {
    const banho = chkBanho.checked, tosa = chkTosa.checked, metodo = metodoAtual();
    const nomes = [];
    if (banho) nomes.push('Banho');
    if (tosa) nomes.push('Tosa');
    document.getElementById('res-servico').textContent = nomes.join(' + ') || 'Não escolhido';
    document.getElementById('res-metodo').textContent =
      metodo === 'telebusca' ? 'Tele-busca (buscamos e levamos em casa)'
      : metodo === 'local' ? 'Entrega no petshop (você leva o pet)' : 'Não escolhido';
    document.getElementById('res-data').textContent = inputData.value ? formatarData(inputData.value) : 'Não escolhida';
    document.getElementById('res-horario').textContent = horarioAtual() || 'Não escolhido';
    document.getElementById('res-total').textContent = dinheiro(calcularTotal(banho, tosa, metodo));
  }

  /* --- Mostra o campo de endereço só para tele-busca --- */
  function atualizarMetodo() {
    const busca = metodoAtual() === 'telebusca';
    campoEndereco.classList.toggle('d-none', !busca);
    inputEndereco.required = busca;
    atualizarResumo();
  }

  chkBanho.addEventListener('change', () => { erroServico.classList.add('d-none'); atualizarResumo(); });
  chkTosa.addEventListener('change', () => { erroServico.classList.add('d-none'); atualizarResumo(); });
  form.querySelectorAll('input[name="metodo"]').forEach((r) => r.addEventListener('change', () => {
    erroMetodo.classList.add('d-none');
    atualizarMetodo();
  }));
  inputData.addEventListener('change', montarHorarios);

  /* --- Envio --- */
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    let ok = form.checkValidity();

    // Validações que o HTML sozinho não faz (grupos de opções)
    if (!chkBanho.checked && !chkTosa.checked) { erroServico.classList.remove('d-none'); ok = false; }
    if (!metodoAtual()) { erroMetodo.classList.remove('d-none'); ok = false; }
    if (!horarioAtual()) { erroHorario.classList.remove('d-none'); ok = false; }
    form.classList.add('was-validated');

    if (!ok) {
      // Foco no primeiro problema, na ordem em que aparecem na tela
      const alvo = !chkBanho.checked && !chkTosa.checked ? erroServico
        : !metodoAtual() ? erroMetodo
        : form.querySelector(':invalid') || erroHorario;
      alvo.focus();
      return;
    }

    // Confere de novo se o horário ainda está livre (evita duplicidade)
    reservas = Armazenamento.ler('pa_agendamentos', []);
    if (reservas.some((r) => r.data === inputData.value && r.horario === horarioAtual())) {
      montarHorarios();
      erroHorario.textContent = 'Esse horário acabou de ser reservado. Escolha outro.';
      erroHorario.classList.remove('d-none');
      return;
    }

    const reserva = {
      protocolo: 'PA-' + Date.now().toString(36).toUpperCase(),
      nome: document.getElementById('ag-nome').value.trim(),
      telefone: document.getElementById('ag-telefone').value.trim(),
      pet: document.getElementById('ag-pet').value.trim(),
      servicos: [chkBanho.checked ? 'Banho' : null, chkTosa.checked ? 'Tosa' : null].filter(Boolean).join(' + '),
      metodo: metodoAtual(),
      endereco: metodoAtual() === 'telebusca' ? inputEndereco.value.trim() : '',
      data: inputData.value,
      horario: horarioAtual(),
      total: calcularTotal(chkBanho.checked, chkTosa.checked, metodoAtual())
    };
    reservas.push(reserva);
    Armazenamento.gravar('pa_agendamentos', reservas);

    avisoSucesso.textContent = 'Agendamento confirmado! Protocolo ' + reserva.protocolo + ': ' +
      reserva.servicos + ' para ' + reserva.pet + ' em ' + formatarData(reserva.data) + ' às ' + reserva.horario + '.';
    avisoSucesso.classList.remove('d-none');
    avisoSucesso.focus();
    avisoSucesso.scrollIntoView({ behavior: 'smooth', block: 'center' });

    form.reset();
    form.classList.remove('was-validated');
    atualizarMetodo();
    montarHorarios();
    listarAgendamentos();
  });

  /* ---------- 4) Lista "Meus agendamentos" ---------- */
  function listarAgendamentos() {
    const lista = document.getElementById('lista-agendamentos');
    lista.innerHTML = '';
    reservas = Armazenamento.ler('pa_agendamentos', []);
    if (reservas.length === 0) {
      lista.innerHTML = '<p class="text-muted-pet mb-0">Você ainda não tem agendamentos neste navegador.</p>';
      return;
    }
    // Ordena por data e horário
    [...reservas].sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario)).forEach((r) => {
      const item = document.createElement('div');
      item.className = 'card-pet p-3 mb-2 d-flex flex-wrap justify-content-between align-items-center gap-2';
      const texto = document.createElement('div');
      // textContent evita inserir HTML digitado pelo usuário (segurança)
      texto.textContent = r.protocolo + ' | ' + r.servicos + ' | ' + r.pet + ' | ' +
        dataLocal(r.data).toLocaleDateString('pt-BR') + ' às ' + r.horario + ' | ' +
        (r.metodo === 'telebusca' ? 'Tele-busca' : 'Entrega no petshop') + ' | ' + dinheiro(r.total);
      const botao = document.createElement('button');
      botao.type = 'button'; botao.className = 'btn btn-sm btn-pet-outline';
      botao.textContent = 'Cancelar';
      botao.setAttribute('aria-label', 'Cancelar agendamento ' + r.protocolo);
      botao.addEventListener('click', () => {
        if (!confirm('Cancelar o agendamento ' + r.protocolo + '?')) return;
        Armazenamento.gravar('pa_agendamentos', reservas.filter((x) => x.protocolo !== r.protocolo));
        listarAgendamentos();
        montarHorarios();
      });
      item.append(texto, botao);
      lista.appendChild(item);
    });
  }

  atualizarMetodo();
  montarHorarios();
  listarAgendamentos();
});
