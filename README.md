# Thomas, o Remédio

Bot do telegram desenvolvido para ajudar as pessoas a se lembrarem de tomar seus remédios na hora certa e na quantidade certa.

Esse bot também é um projeto pessoal que ainda tem muito a melhorar, por enquanto só possui algumas funcionalidades básicas :)

Pra acessar ele no telegram, basta chamar @ThomasORemedioBot. Os comandos disponíveis no momento são:
- /start
- /novoremedio
- /meusremedios
- /removerremedios

## Funcionalidades

- Cadastra medicamentos com nome e foto (opcional)
- Agenda lembretes por:
  - Intervalo fixo (ex: a cada 8 horas)
  - Horário específico diário (ex: 08:00 todos os dias)
  - Expressão cron personalizada
- Permite definir duração:
  - Por quantidade de doses
  - Indefinidamente (até o usuário remover)
- Mantém histórico de execuções

## Tecnologias

- [Node.js](https://nodejs.org/)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [node-schedule](https://github.com/node-schedule/node-schedule)
- [BotFather]()

## Como rodar localmente

1. Clone o projeto:
   ```bash
   git clone https://github.com/juliacribeiro/ThomasORemedio.git
   cd nome-do-seu-repositorio

2. Instale as dependências
   ```bash
   npm install

3. Crie o arquivo .env no seu repositório e insira seu token do telegram com esse nome (criado via botfather)
    ```bash
    TELEGRAM_TOKEN=seu_token_do_bot_aqui

4. Inicie o bot
    ```bash
    node index.js
