# Outbound System: Ecossistema de Gestão Operacional

![Outbound System Logo](assets/outbound_system.ico)

## Visão Geral

O **Outbound System** é uma plataforma web desenvolvida para otimizar a gestão e a visualização de dados operacionais em ambientes corporativos. Ele atua como um ecossistema integrado, oferecendo módulos especializados para o acompanhamento de métricas críticas, análise de desempenho e geração de relatórios visuais. O objetivo principal é facilitar a tomada de decisões estratégicas e promover a melhoria contínua dos processos.

## Módulos

O sistema é estruturado em um portal central e módulos operacionais específicos:

### 1. Portal Central

O `index.html` serve como o ponto de entrada principal, apresentando uma interface intuitiva para que os usuários possam selecionar e acessar os módulos disponíveis. Ele inclui uma animação de entrada e exibe o status de cada módulo (disponível ou em desenvolvimento).

### 2. Módulo de Auditoria HSE

Localizado em `auditHse.html`, este módulo é dedicado à gestão de auditorias de Saúde, Segurança e Meio Ambiente (HSE). Suas funcionalidades incluem:

*   **Dashboard Geral:** Uma visão consolidada de auditorias, score médio, departamentos envolvidos e total de conformidades.
*   **Filtros Dinâmicos:** Permite filtrar dados por departamento e período para análises específicas.
*   **Visualização de Dados:** Apresenta gráficos interativos (Chart.js) que mostram a distribuição de auditorias e a evolução do score. Uma tabela detalha as últimas auditorias.
*   **Auditorias por Colaborador:** Seção para análise de desempenho individual em auditorias.
*   **Exportação de Relatórios Visuais:** Capacidade de gerar relatórios em formato de imagem a partir dos dashboards, utilizando `html2canvas` e um motor de relatórios customizado (`report-engine.js`).
*   **Fonte de Dados:** Consome dados através de uma API baseada em Google Apps Script, que interage com planilhas Google Sheets.

### 3. Módulo de Produtividade

Disponível em `produtividade.html`, este módulo foca no acompanhamento de métricas de produtividade operacional para as etapas de Picking, Rebin, Packing e Ship Dock. As características incluem:

*   **Visão Geral:** Cards de resumo com percentual de meta atingida, meta total e realizado para cada processo.
*   **Gráfico de Linha por Hora:** Ilustra a evolução da produtividade ao longo das horas do dia para cada processo.
*   **Tabelas Detalhadas por Turno:** Segmenta os dados por 1º, 2º e 3º turno, além de um resumo consolidado. Exibe FCT (Forecast), Capacidade, Meta, Realizado, Pessoas e TPH (Taxa Por Hora).
*   **Ranking Individual:** Um recurso interativo que, ao clicar em células das tabelas de turno, exibe um modal com o ranking de produtividade individual dos colaboradores por UPH (Unidades Por Hora) para o setor e período selecionados. Este ranking é alimentado por APIs específicas para cada processo (`ranking-script.js`).
*   **Fonte de Dados:** Utiliza uma API baseada em Google Apps Script para coletar dados de produtividade de Google Sheets.

## Tecnologias Utilizadas

O Outbound System é construído com um stack de tecnologias web padrão:

*   **Frontend:** HTML5, CSS3 (com tema escuro e glassmorphism), JavaScript.
*   **Bibliotecas JavaScript:** Chart.js, XLSX.js, html2canvas, Font Awesome.
*   **Backend/Dados:** Google Apps Script como camada de API para acesso e manipulação de dados armazenados em Google Sheets.

## Como Usar

Para utilizar o Outbound System, siga os passos abaixo:

1.  **Download:** Baixe o repositório completo do projeto.
2.  **Execução Local:** Abra o arquivo `Abrir_Sistema.bat` (para usuários Windows) ou o `index.html` diretamente em seu navegador web preferido.
3.  **Navegação:** No portal central, selecione o módulo desejado (Auditoria HSE ou Produtividade) para acessar seus respectivos dashboards e funcionalidades.

**Nota:** O sistema depende de APIs externas (Google Apps Script) para carregar os dados. Certifique-se de ter conexão com a internet para o funcionamento completo.

## Estrutura do Projeto

```
outboundSys/
├── Abrir_Sistema.bat
├── assets/
│   ├── favicon.ico
│   ├── icon_base.png
│   ├── outbound_system.ico
│   ├── prod-script.js
│   ├── ranking-script.js
│   ├── report-engine.js
│   ├── script.js
│   └── style.css
├── auditHse.html
├── index.html
└── produtividade.html
```

## Contribuição

Contribuições são bem-vindas! Para propor melhorias ou corrigir problemas, por favor, abra uma issue ou envie um pull request.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## Contato

Para dúvidas ou suporte, entre em contato com Rai da Silva em @rai.lima@luftsilutions.com.
