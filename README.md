# 🦷 MinhaAgenda — Sistema de Gestão Odontológica e Painel Clínico

**MinhaAgenda** é uma solução web moderna, responsiva e interativa desenvolvida para a gestão completa de consultas, pacientes e corpo clínico em clínicas médicas e odontológicas. 

A aplicação conecta-se a uma API backend construída em **FastAPI** (hospedada na Vercel) com autenticação via token **JWT (OAuth2)**, oferecendo atualização de status em tempo real, cálculo dinâmico de estatísticas, modais interativos para cadastros/edições e integração para notificações via WhatsApp e E-mail.

---

## 📋 Sumário

- [Visão Geral e Diferenciais](#-visão-geral-e-diferenciais)
- [Funcionalidades Detalhadas](#-funcionalidades-detalhadas)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Credenciais e Conexão com a API](#-credenciais-e-conexão-com-a-api)
- [Como Executar Localmente](#-como-executar-localmente)
- [Publicação no GitHub e Vercel](#-publicação-no-github-e-vercel)
- [Autor e Licença](#-autor-e-licença)

---

## 🌟 Visão Geral e Diferenciais

O **MinhaAgenda** foi projetado para otimizar o fluxo de trabalho de recepções e profissionais de saúde, centralizando todas as operações essenciais em uma única interface clara e intuitiva:

* **Design Funcional e Clean:** Dashboard estruturado com Bootstrap 5, menu lateral intuitivo e suporte a telas de diversas resoluções.
* **Feedback Visual Instantâneo:** Indicadores de conexão com a API, contadores estatísticos dinâmicos e etiquetas coloridas (*badges*) para identificação rápida do status de cada consulta.
* **Resiliência e Fallbacks:** Suporte nativo para manipulação de dados tanto via API RESTful quanto via estado local em memória caso ocorram instabilidades.

---

## 🚀 Funcionalidades Detalhadas

### 📅 1. Painel de Agendamentos (Aba Principal)
* **Lista de Consultas:** Exibição clara contendo ID do agendamento, Nome do Paciente, CPF, Médico/Dentista responsável, Data/Hora, Status atual e Motivo de ausência/cancelamento.
* **Cards Resumo (KPIs):** Atualização dinâmica em tempo real do total de consultas, agendamentos confirmados e pendentes.
* **Novo Agendamento:** Modal interativo que permite escolher um paciente (carregando o CPF de forma automática) e associá-lo a um profissional ativo na agenda.
* **Gerenciador de Status (Pop-up Modal):**
  * **Confirmar / Agendar:** Altera o status para *Confirmado*.
  * **Concluir Consulta:** Finaliza o atendimento realizado.
  * **Paciente Ausente:** Exige preenchimento obrigatório da justificativa da ausência antes de atualizar.
  * **Cancelar Consulta:** Exige preenchimento obrigatório do motivo de cancelamento.
* **Notificações diretas:**
  * **WhatsApp:** Gera um link seguro com mensagem pré-formatada e abre o app/web diretamente para o paciente.
  * **E-mail:** Dispara aviso e alerta visual de envio de lembrete de consulta.

### 👥 2. Gestão de Pacientes (Aba Pacientes)
* **Listagem Inteligente:** Apresenta histórico de consultas atreladas ao paciente.
* **Novo Cadastramento:** Formulário modal com validação de campos (Nome, CPF, Telefone/WhatsApp, E-mail).
* **Edição Completa:** Permite alterar dados cadastrais de qualquer paciente cadastrado.
* **Remoção:** Exclusão com confirmação de segurança.

### 🩺 3. Corpo Clínico e Especialidades (Aba Médicos)
* **Cadastro de Profissionais:** Registro completo com nome, conselho profissional (CRM/CRO), especialidade e telefone.
* **Controle de Disponibilidade:** Status editável do profissional (*Ativo*, *Em Férias*, *Inativo*).
* **Filtro em Tempo Real:** Apenas médicos com status **Ativo** aparecem disponíveis para novos agendamentos.

### 🔐 4. Autenticação & Conexão Backend
* Integração com backend em **FastAPI**.
* Autenticação via formulário `OAuth2PasswordRequestForm` obtendo token JWT (`Bearer`).
* Indicador de status na barra lateral (*Conectado* / *Desconectado*).

---

## 🏗️ Arquitetura do Projeto

O projeto adota uma estrutura simples, limpa e modularizada:

```text
minha-agenda-frontend/
│
├── index.html        # Estrutura HTML5, folhas de estilo (Bootstrap/FontAwesome) e Modais
├── app.js            # Lógica de negócio, manipulação do DOM, requisições Fetch/API
└── README.md         # Documentação completa do repositório
```

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estruturação semântica da aplicação.
* **CSS3 & Bootstrap 5.3:** Componentização, layout responsivo e modais.
* **Font Awesome 6.4:** Iconografia clínica e operacional.
* **JavaScript (ES6+ Vanilla JS):** Lógica de estado, manipulação assíncrona com `async/await`, consumo de APIs via `fetch`.
* **FastAPI:** Backend RESTful para autenticação e persistência de agendamentos.

---

## 🔑 Credenciais e Conexão com a API

Para testar a integração com o backend em ambiente de produção:

> **Como autenticar no painel:**
> 1. Acesse a aplicação.
> 2. No menu lateral esquerdo, clique no botão **"Autenticar API"**.
> 3. Confirme os dados e clique em **"Entrar / Obter Token"**.
> 4. O indicador mudará para **Conectado** (verde) e os dados da API serão carregados.

---

## 💻 Como Executar Localmente

1. Clone este repositório para o seu computador:
   ```bash
   git clone https://github.com/seu-usuario/minha-agenda-frontend.git
   ```

2. Acesse a pasta do projeto:
   ```bash
   cd minha-agenda-frontend
   ```

3. Abra o arquivo `index.html` em qualquer navegador web (Chrome, Firefox, Edge, Safari) ou utilize a extensão **Live Server** no VS Code.

---

## 🌐 Publicação no GitHub e Vercel

### Subir para o GitHub
```bash
git init
git add .
git commit -m "feat: versão final do projeto MinhaAgenda"
git branch -M main
git remote add origin https://github.com/seu-usuario/minha-agenda-frontend.git
git push -u origin main
```

### Deploy na Vercel
1. Acesse o painel da [Vercel](https://vercel.com).
2. Clique em **"Add New Project"** e selecione o repositório **`minha-agenda-frontend`**.
3. Clique em **Deploy** (a Vercel detectará automaticamente como site estático).
4. O link público será gerado instantaneamente!

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

---

<p center="align">
  Desenvolvido com 💙 para otimização da gestão em saúde e odontologia.
</p>