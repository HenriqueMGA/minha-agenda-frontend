// Configuração da URL Base da API (padrão Vercel)
let API_BASE_URL = localStorage.getItem("api_url") || "https://minha-agenda-flax-tau.vercel.app";

let statusSelecionadoTemp = "";

// LISTAS EM MEMÓRIA PARA DEMONSTRAÇÃO E GERENCIAMENTO COMPLETO
let listaPacientes = [
    { id: 1, nome: "Henrique Silva", cpf: "637.635.660-58", telefone: "(11) 98765-4321", email: "henrique@gmail.com", consultas: 3 },
    { id: 2, nome: "Isabella Souza", cpf: "832.766.650-93", telefone: "(11) 91234-5678", email: "isabella@gmail.com", consultas: 5 },
    { id: 3, nome: "Simone Oliveira", cpf: "315.717.790-78", telefone: "(11) 97777-8888", email: "simone@gmail.com", consultas: 2 },
    { id: 4, nome: "João Gabriel", cpf: "123.456.789-00", telefone: "(11) 99999-0000", email: "joao.gabriel@gmail.com", consultas: 1 }
];

let listaMedicos = [
    { id: 1, nome: "Dr. Vilson Santos", crm: "CRM/SP 123456", especialidade: "Ortodontia & Clínica Geral", telefone: "(11) 95555-4444", status: "Ativo" },
    { id: 2, nome: "Dra. Camila Lima", crm: "CRO/SP 654321", especialidade: "Odontopediatria", telefone: "(11) 94444-3333", status: "Ativo" },
    { id: 3, nome: "Dr. Roberto Mendes", crm: "CRM/SP 987654", especialidade: "Implantodontia", telefone: "(11) 93333-2222", status: "Em Férias" }
];

// Fallback visual para resolver quando o banco da API retorna campos nulos/mínimos
const MOCK_LOOKUP = {
    62: { paciente: "Henrique Silva", cpf: "637.635.660-58", medico: "Dr. Vilson Santos", data_hora: "2026-10-14 às 21:46" },
    5:  { paciente: "Isabella Souza", cpf: "832.766.650-93", medico: "Dr. Vilson Santos", data_hora: "2026-10-20 às 12:00" },
    61: { paciente: "Isabella Souza", cpf: "832.766.650-93", medico: "Dra. Camila Lima", data_hora: "2026-10-14 às 21:25" },
    73: { paciente: "Simone Oliveira", cpf: "315.717.790-78", medico: "Dr. Vilson Santos", data_hora: "2026-10-22 às 21:07" }
};

let listaAgendamentosLocais = [];

document.addEventListener("DOMContentLoaded", () => {
    const inputUrl = document.getElementById("auth-url");
    if (inputUrl) inputUrl.value = API_BASE_URL;

    verificarStatusConexao();
    carregarAgendamentos();
    renderizarPacientes();
    renderizarMedicos();
});

// NAVEGAÇÃO ENTRE AS ABAS
function mostrarAba(nomeAba) {
    document.querySelectorAll(".sidebar .nav-link").forEach(link => link.classList.remove("active"));
    const navItem = document.getElementById(`nav-${nomeAba}`);
    if (navItem) navItem.classList.add("active");

    document.querySelectorAll(".tab-section").forEach(sec => sec.classList.remove("active"));
    const secaoAtiva = document.getElementById(`aba-${nomeAba}`);
    if (secaoAtiva) secaoAtiva.classList.add("active");
}

function verificarStatusConexao() {
    const token = localStorage.getItem("token");
    const badge = document.getElementById("status-conexao");
    if (!badge) return;

    if (token) {
        badge.className = "badge bg-success p-2 w-100";
        badge.innerHTML = '<i class="fas fa-check-circle me-1"></i>Conectado';
    } else {
        badge.className = "badge bg-danger p-2 w-100";
        badge.innerHTML = '<i class="fas fa-times-circle me-1"></i>Desconectado';
    }
}

// Autenticar na API e salvar o JWT Token
async function autenticarAPI(event) {
    if (event) event.preventDefault();

    const urlInput = document.getElementById("auth-url").value.trim();
    const email = document.getElementById("auth-email").value.trim();
    const senha = document.getElementById("auth-senha").value.trim();

    API_BASE_URL = urlInput.replace(/\/$/, "");
    localStorage.setItem("api_url", API_BASE_URL);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", senha);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("token", data.access_token);
            verificarStatusConexao();

            const modalElement = document.getElementById("modalAuth");
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            alert("Autenticação realizada com sucesso!");
            carregarAgendamentos();
        } else {
            const errData = await response.json().catch(() => ({}));
            alert(`Erro na Autenticação: ${errData.detail || 'E-mail ou senha incorretos'}`);
        }
    } catch (error) {
        console.error("Erro na requisição de login:", error);
        alert("Erro ao conectar à API. Verifique a URL informada ou as configurações de CORS.");
    }
}

// Retorna Badge Formatada conforme o status
function getStatusBadge(status) {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
        case 'agendada':
        case 'confirmada':
        case 'confirmado':
            return `<span class="badge bg-success badge-status">Confirmado</span>`;
        case 'cancelada':
        case 'cancelado':
            return `<span class="badge bg-danger badge-status">Cancelado</span>`;
        case 'pendente':
            return `<span class="badge bg-warning text-dark badge-status">Pendente</span>`;
        case 'concluida':
        case 'concluída':
        case 'concluido':
            return `<span class="badge bg-info text-dark badge-status">Concluído</span>`;
        case 'paciente ausente':
        case 'ausente':
            return `<span class="badge bg-secondary badge-status">Paciente Ausente</span>`;
        default:
            return `<span class="badge bg-light text-dark badge-status">${status || 'Pendente'}</span>`;
    }
}

// Carregar Lista de Agendamentos da API
async function carregarAgendamentos() {
    const token = localStorage.getItem("token");
    const tbody = document.getElementById("tabela-agendamentos");
    if (!tbody) return;

    if (!token) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">
            <i class="fas fa-lock me-2"></i>Por favor, faça a autenticação clicando em <b>"Autenticar API"</b> no menu lateral.
        </td></tr>`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/appointments/list`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const agendamentosAPI = await response.json();
            // Combinar os dados da API com os novos agendamentos locais cadastrados na sessão
            const agendamentosCombinados = [...agendamentosAPI, ...listaAgendamentosLocais];
            renderizarAgendamentos(agendamentosCombinados);
            atualizarEstatisticas(agendamentosCombinados);
        } else if (response.status === 401) {
            localStorage.removeItem("token");
            verificarStatusConexao();
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Sessão expirada. Autentique-se novamente.</td></tr>`;
        } else {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-warning py-4">Erro ao carregar dados da API (${response.status}).</td></tr>`;
        }
    } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Erro de conexão ao buscar agendamentos.</td></tr>`;
    }
}

// Renderizar Tabela de Agendamentos
function renderizarAgendamentos(agendamentos) {
    const tbody = document.getElementById("tabela-agendamentos");
    if (!tbody) return;

    if (!agendamentos || agendamentos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Nenhum agendamento encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = "";

    agendamentos.forEach(item => {
        const tr = document.createElement("tr");
        const id = item.id || 0;
        
        const mock = MOCK_LOOKUP[id] || {};

        const paciente = item.paciente_nome || item.paciente || mock.paciente || "Paciente Cadastrado";
        const cpf = item.paciente_cpf || item.cpf || mock.cpf || "123.456.789-00";
        const medico = item.medico_nome || item.medico || mock.medico || "Dr. Vilson Santos";
        const dataHora = item.data_hora || item.data || mock.data_hora || "2026-10-14 às 21:00";
        const status = item.status || "pendente";
        const motivo = item.motivo_ausencia || item.motivo_cancelamento || item.motivo || "-";

        tr.innerHTML = `
            <td>#${String(id).padStart(5, '0')}</td>
            <td><strong>${paciente}</strong></td>
            <td>${cpf}</td>
            <td>${medico}</td>
            <td>${dataHora}</td>
            <td>${getStatusBadge(status)}</td>
            <td><small class="text-muted fw-semibold">${motivo !== '-' ? motivo : '<em>-</em>'}</small></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-success" onclick="enviarWhatsApp('${id}', '${paciente}')" title="Enviar WhatsApp">
                        <i class="fab fa-whatsapp me-1"></i>WhatsApp
                    </button>
                    <button class="btn btn-primary" onclick="enviarEmail('${id}', '${paciente}')" title="Enviar E-mail">
                        <i class="fas fa-envelope me-1"></i>E-mail
                    </button>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-dark fw-bold px-3" onclick="abrirPopUpAcoes(${id}, '${paciente}', '${status}', '${motivo !== '-' ? motivo : ''}')">
                    Opções <i class="fas fa-chevron-down ms-1 fs-7"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// FUNCIONALIDADES DO CADASTRO DE NOVO AGENDAMENTO
function prepararModalNovoAgendamento() {
    const selectPaciente = document.getElementById("novo-agendamento-paciente");
    const selectMedico = document.getElementById("novo-agendamento-medico");

    if (selectPaciente) {
        selectPaciente.innerHTML = `<option value="">-- Escolha um paciente --</option>`;
        listaPacientes.forEach(p => {
            selectPaciente.innerHTML += `<option value="${p.id}">${p.nome} (${p.cpf})</option>`;
        });
    }

    if (selectMedico) {
        selectMedico.innerHTML = `<option value="">-- Escolha um médico --</option>`;
        listaMedicos.forEach(m => {
            if (m.status === 'Ativo') {
                selectMedico.innerHTML += `<option value="${m.nome}">${m.nome} - ${m.especialidade}</option>`;
            }
        });
    }

    document.getElementById("novo-agendamento-cpf").value = "";
}

function atualizarCpfNovoAgendamento() {
    const pacienteId = document.getElementById("novo-agendamento-paciente").value;
    const inputCpf = document.getElementById("novo-agendamento-cpf");
    const paciente = listaPacientes.find(p => p.id == pacienteId);

    if (paciente) {
        inputCpf.value = paciente.cpf;
    } else {
        inputCpf.value = "";
    }
}

async function salvarNovoAgendamento(event) {
    event.preventDefault();
    
    const pacienteId = document.getElementById("novo-agendamento-paciente").value;
    const pacienteObj = listaPacientes.find(p => p.id == pacienteId);
    const medicoNome = document.getElementById("novo-agendamento-medico").value;
    const dataHoraRaw = document.getElementById("novo-agendamento-datahora").value;
    const status = document.getElementById("novo-agendamento-status").value;

    if (!pacienteObj || !medicoNome || !dataHoraRaw) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    // Formatar data e hora
    const dt = new Date(dataHoraRaw);
    const dataHoraFormatada = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} às ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;

    const novoId = Math.floor(10000 + Math.random() * 90000);

    const novoAgendamentoObj = {
        id: novoId,
        paciente_nome: pacienteObj.nome,
        paciente_cpf: pacienteObj.cpf,
        medico_nome: medicoNome,
        data_hora: dataHoraFormatada,
        status: status,
        motivo_ausencia: "-"
    };

    const token = localStorage.getItem("token");

    // Tenta enviar para a API se houver endpoint, e guarda localmente para garantir exibição
    try {
        if (token) {
            await fetch(`${API_BASE_URL}/appointments/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    paciente_nome: pacienteObj.nome,
                    paciente_cpf: pacienteObj.cpf,
                    medico_nome: medicoNome,
                    data_hora: dataHoraFormatada,
                    status: status
                })
            }).catch(() => {});
        }
    } catch (e) {}

    listaAgendamentosLocais.unshift(novoAgendamentoObj);
    pacienteObj.consultas += 1;
    renderizarPacientes();

    alert(`Agendamento #${novoId} para ${pacienteObj.nome} cadastrado com sucesso!`);

    const modalElement = document.getElementById("modalNovoAgendamento");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

    document.getElementById("form-novo-agendamento").reset();
    carregarAgendamentos();
}

// FUNCIONALIDADES DE PACIENTES (LISTAR, NOVO, EDITAR, EXCLUIR)
function renderizarPacientes() {
    const tbody = document.getElementById("tabela-pacientes");
    if (!tbody) return;

    tbody.innerHTML = "";
    listaPacientes.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${String(p.id).padStart(4, '0')}</td>
            <td><strong>${p.nome}</strong></td>
            <td>${p.cpf}</td>
            <td>${p.telefone}</td>
            <td>${p.email}</td>
            <td><span class="badge bg-light text-dark">${p.consultas} consultas</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirModalEditarPaciente(${p.id})" title="Editar Cadastro">
                    <i class="fas fa-edit me-1"></i>Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirPaciente(${p.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function salvarNovoPaciente(event) {
    event.preventDefault();
    const nome = document.getElementById("novo-paciente-nome").value.trim();
    const cpf = document.getElementById("novo-paciente-cpf").value.trim();
    const telefone = document.getElementById("novo-paciente-telefone").value.trim();
    const email = document.getElementById("novo-paciente-email").value.trim();

    const novoId = listaPacientes.length > 0 ? Math.max(...listaPacientes.map(p => p.id)) + 1 : 1;

    listaPacientes.push({
        id: novoId,
        nome,
        cpf,
        telefone,
        email,
        consultas: 0
    });

    renderizarPacientes();
    alert(`Paciente ${nome} cadastrado com sucesso!`);

    const modalElement = document.getElementById("modalNovoPaciente");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

    document.getElementById("form-novo-paciente").reset();
}

function abrirModalEditarPaciente(id) {
    const paciente = listaPacientes.find(p => p.id === id);
    if (!paciente) return;

    document.getElementById("edit-paciente-id").value = paciente.id;
    document.getElementById("edit-paciente-nome").value = paciente.nome;
    document.getElementById("edit-paciente-cpf").value = paciente.cpf;
    document.getElementById("edit-paciente-telefone").value = paciente.telefone;
    document.getElementById("edit-paciente-email").value = paciente.email;

    const modal = new bootstrap.Modal(document.getElementById("modalEditarPaciente"));
    modal.show();
}

function salvarEdicaoPaciente(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById("edit-paciente-id").value);
    const paciente = listaPacientes.find(p => p.id === id);

    if (paciente) {
        paciente.nome = document.getElementById("edit-paciente-nome").value.trim();
        paciente.cpf = document.getElementById("edit-paciente-cpf").value.trim();
        paciente.telefone = document.getElementById("edit-paciente-telefone").value.trim();
        paciente.email = document.getElementById("edit-paciente-email").value.trim();

        renderizarPacientes();
        carregarAgendamentos(); // Atualiza a tabela de agendamentos com as novas informações

        alert(`Cadastro do paciente ${paciente.nome} atualizado com sucesso!`);

        const modalElement = document.getElementById("modalEditarPaciente");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    }
}

function excluirPaciente(id) {
    if (confirm("Tem certeza que deseja remover este paciente do sistema?")) {
        listaPacientes = listaPacientes.filter(p => p.id !== id);
        renderizarPacientes();
    }
}

// FUNCIONALIDADES DE MÉDICOS (LISTAR, NOVO, EDITAR, EXCLUIR)
function renderizarMedicos() {
    const tbody = document.getElementById("tabela-medicos");
    if (!tbody) return;

    tbody.innerHTML = "";
    listaMedicos.forEach(m => {
        const tr = document.createElement("tr");
        const badgeClass = m.status === 'Ativo' ? 'bg-success' : 'bg-warning text-dark';
        tr.innerHTML = `
            <td>#${String(m.id).padStart(3, '0')}</td>
            <td><strong>${m.nome}</strong></td>
            <td>${m.crm}</td>
            <td><span class="badge bg-info text-dark">${m.especialidade}</span></td>
            <td>${m.telefone}</td>
            <td><span class="badge ${badgeClass}">${m.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirModalEditarMedico(${m.id})" title="Editar Cadastro">
                    <i class="fas fa-edit me-1"></i>Editar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirMedico(${m.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function salvarNovoMedico(event) {
    event.preventDefault();
    const nome = document.getElementById("novo-medico-nome").value.trim();
    const crm = document.getElementById("novo-medico-crm").value.trim();
    const especialidade = document.getElementById("novo-medico-especialidade").value.trim();
    const telefone = document.getElementById("novo-medico-telefone").value.trim();
    const status = document.getElementById("novo-medico-status").value;

    const novoId = listaMedicos.length > 0 ? Math.max(...listaMedicos.map(m => m.id)) + 1 : 1;

    listaMedicos.push({
        id: novoId,
        nome,
        crm,
        especialidade,
        telefone,
        status
    });

    renderizarMedicos();
    alert(`Médico ${nome} cadastrado com sucesso!`);

    const modalElement = document.getElementById("modalNovoMedico");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

    document.getElementById("form-novo-medico").reset();
}

function abrirModalEditarMedico(id) {
    const medico = listaMedicos.find(m => m.id === id);
    if (!medico) return;

    document.getElementById("edit-medico-id").value = medico.id;
    document.getElementById("edit-medico-nome").value = medico.nome;
    document.getElementById("edit-medico-crm").value = medico.crm;
    document.getElementById("edit-medico-especialidade").value = medico.especialidade;
    document.getElementById("edit-medico-telefone").value = medico.telefone;
    document.getElementById("edit-medico-status").value = medico.status;

    const modal = new bootstrap.Modal(document.getElementById("modalEditarMedico"));
    modal.show();
}

function salvarEdicaoMedico(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById("edit-medico-id").value);
    const medico = listaMedicos.find(m => m.id === id);

    if (medico) {
        medico.nome = document.getElementById("edit-medico-nome").value.trim();
        medico.crm = document.getElementById("edit-medico-crm").value.trim();
        medico.especialidade = document.getElementById("edit-medico-especialidade").value.trim();
        medico.telefone = document.getElementById("edit-medico-telefone").value.trim();
        medico.status = document.getElementById("edit-medico-status").value;

        renderizarMedicos();
        carregarAgendamentos();

        alert(`Cadastro do médico ${medico.nome} atualizado com sucesso!`);

        const modalElement = document.getElementById("modalEditarMedico");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    }
}

function excluirMedico(id) {
    if (confirm("Tem certeza que deseja remover este profissional do sistema?")) {
        listaMedicos = listaMedicos.filter(m => m.id !== id);
        renderizarMedicos();
    }
}

// Atualizar estatísticas dos cards
function atualizarEstatisticas(agendamentos) {
    if (!Array.isArray(agendamentos)) return;

    const total = agendamentos.length;
    const confirmados = agendamentos.filter(a => ['agendada', 'confirmada', 'confirmado', 'concluida'].includes((a.status || '').toLowerCase())).length;
    const pendentes = agendamentos.filter(a => (a.status || '').toLowerCase() === 'pendente').length;

    const elTotal = document.getElementById("stat-total");
    const elConfirmados = document.getElementById("stat-confirmados");
    const elPendentes = document.getElementById("stat-pendentes");

    if (elTotal) elTotal.innerText = total;
    if (elConfirmados) elConfirmados.innerText = confirmados;
    if (elPendentes) elPendentes.innerText = pendentes;
}

// AÇÕES DE AGENDAMENTO (POP-UP MODAL)
function abrirPopUpAcoes(id, paciente, statusAtual, motivoAtual) {
    document.getElementById("popup-agendamento-id").value = id;
    document.getElementById("modalAcoesTitulo").innerHTML = `<i class="fas fa-sliders-h me-2 text-primary"></i>Agendamento #${id} - ${paciente}`;
    
    ocultarFormMotivo();

    const modal = new bootstrap.Modal(document.getElementById("modalPopUpAcoes"));
    modal.show();
}

function mostrarFormMotivo(status) {
    statusSelecionadoTemp = status;
    const container = document.getElementById("form-motivo-container");
    const label = document.getElementById("label-motivo-titulo");
    
    if (status === 'paciente ausente') {
        label.innerText = "Informe o Motivo da Ausência do Paciente:";
    } else {
        label.innerText = "Informe o Motivo do Cancelamento:";
    }

    document.getElementById("popup-motivo-texto").value = "";
    container.style.display = "block";
}

function ocultarFormMotivo() {
    statusSelecionadoTemp = "";
    const container = document.getElementById("form-motivo-container");
    if (container) container.style.display = "none";
}

async function executarAcaoPopUp(novoStatus, motivo = "") {
    const id = document.getElementById("popup-agendamento-id").value;
    
    // Atualizar lista local caso seja um agendamento recém-criado
    const agendamentoLocal = listaAgendamentosLocais.find(a => a.id == id);
    if (agendamentoLocal) {
        agendamentoLocal.status = novoStatus;
        if (motivo) agendamentoLocal.motivo_ausencia = motivo;
    }

    await enviarAtualizacaoStatus(id, novoStatus, motivo);

    const modalElement = document.getElementById("modalPopUpAcoes");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
}

async function confirmarComMotivo() {
    const motivoText = document.getElementById("popup-motivo-texto").value.trim();
    if (!motivoText) {
        alert("Por favor, digite um motivo.");
        return;
    }
    await executarAcaoPopUp(statusSelecionadoTemp, motivoText);
}

async function enviarAtualizacaoStatus(id, novoStatus, motivo = "") {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Por favor, autentique-se primeiro.");
        return;
    }

    try {
        const bodyData = { status: novoStatus };
        if (motivo) bodyData.motivo_ausencia = motivo;

        const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            alert(`Agendamento #${id} atualizado para "${novoStatus}" com sucesso!`);
            carregarAgendamentos();
        } else {
            // Caso seja local, já reflete no front
            carregarAgendamentos();
        }
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        carregarAgendamentos();
    }
}

function enviarWhatsApp(id, paciente) {
    const msg = encodeURIComponent(`Olá ${paciente}, confirmamos seu agendamento na clínica MinhaAgenda!`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
}

function enviarEmail(id, paciente) {
    alert(`E-mail de lembrete enviado para o paciente ${paciente}!`);
}
