# API de Geração de Conteúdo

Um serviço backend modular em TypeScript para geração de conteúdo, incluindo geração de cópias, geração de imagens e análise de vídeo utilizando serviços de IA (OpenAI, Gemini, fal.ai).

## Índice

- [Requisitos](#requisitos)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Instalação](#instalação)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Implantação na AWS](#implantação-na-aws)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Documentação da API](#documentação-da-api)
- [Solução de Problemas](#solução-de-problemas)

## Requisitos

- Node.js (v16+)
- npm ou yarn
- Conta na AWS para implantação
- Chaves de API para diversos serviços:
  - OpenAI
  - Google Gemini
  - Fal.ai
  - Acesso ao AWS S3

## Variáveis de Ambiente

Crie um arquivo `.env` no diretório raiz com as seguintes variáveis:

```dotenv
# Configuração do App
PORT=3000
APP_USERNAME=seu_nome_de_usuario
APP_PASSWORD=sua_senha
JWT_SECRET=sua_chave_secreta_jwt

# Chaves de API
OPENAI_API_KEY=sua_chave_api_openai
GEMINI_API_KEY=sua_chave_api_gemini
FAL_KEY=sua_chave_api_fal_ai

# Configuração AWS
MY_AWS_ACCESS_KEY_ID=sua_chave_de_acesso_aws
MY_AWS_SECRET_ACCESS_KEY=sua_chave_secreta_aws
MY_AWS_BUCKET_NAME=nome_do_seu_bucket_s3
MY_AWS_REGION=sa-east-1
```

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd <diretorio-do-repositorio>

# Instale as dependências
npm install

# Compile o código TypeScript
npm run build
```

## Desenvolvimento Local

```bash
# Inicie o servidor de desenvolvimento com recarregamento automático
npm run dev

# Ou inicie o servidor de produção após a compilação
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000` (ou na porta especificada no seu arquivo `.env`).

## Implantação na AWS

Este projeto utiliza o Serverless Framework para implantação na AWS.

### Pré-requisitos

1. Configure as credenciais da AWS na sua máquina:
   ```bash
   aws configure
   ```
   Você precisará inserir seu ID de Chave de Acesso AWS, Chave de Acesso Secreta e região padrão.

2. Certifique-se de que suas variáveis de ambiente estão definidas no arquivo `.env`.

### Implantação na AWS

```bash
# Implantar na AWS
npm run deploy
```

Isso implantará sua aplicação no AWS Lambda e configurará os endpoints necessários do API Gateway.

### Atualizando sua Implantação

Após fazer alterações no código:

```bash
# Compile a aplicação
npm run build

# Implante o código atualizado
npm run deploy
```

## Estrutura do Projeto

```
src/
├── config.ts                    # Variáveis de configuração
├── controllers/                 # Manipuladores de requisições
│   ├── auth.controller.ts
│   ├── copy-generator.controller.ts
│   ├── examples.controller.ts
│   ├── image-generator.controller.ts
│   └── video-analyser.controller.ts
├── middleware/                  # Middleware do Express
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/                      # Rotas da API
│   ├── auth.routes.ts
│   ├── copy-generator.routes.ts
│   ├── examples.routes.ts
│   ├── image-generator.routes.ts
│   ├── index.ts
│   └── video-analyser.routes.ts
├── services/                    # Integrações com serviços externos
│   ├── fal.service.ts
│   ├── gemini.service.ts
│   ├── openai.service.ts
│   └── s3.service.ts
├── types.ts                     # Interfaces TypeScript
├── utils/                       # Funções utilitárias
│   ├── helpers.ts
│   └── prompts.ts
└── server.ts                    # Ponto de entrada principal da aplicação
```

## Documentação da API

### Autenticação

Todos os endpoints, exceto `/login`, exigem um cabeçalho de Autorização com um token Bearer.

```
Authorization: Bearer <seu-token-jwt>
```

### Endpoints

#### Autenticação

- **POST /login**
  - Corpo da Requisição: `{ username: string, password: string }`
  - Resposta: `{ token: string }`

#### Geração de Cópia

- **GET /get-adventures-guideline**
  - Resposta: Dados de diretrizes para os dropdowns do formulário
  
- **POST /generate-copy**
  - Corpo da Requisição: Dados do formulário incluindo marca, público-alvo e configurações de conteúdo
  - Resposta: Conteúdo de cópia gerado

#### Geração de Imagem

- **POST /generate-prompt-image**
  - Requisição: Dados do formulário com arquivo de imagem
  - Resposta: `{ prompt: string }` - Descrição de imagem gerada
  
- **POST /generate-image**
  - Corpo da Requisição: `{ prompt: string, inferenceSteps: number, guidanceScale: number, width: number, height: number }`
  - Resposta: `{ requestId: string }`
  
- **GET /image-status/:requestId**
  - Resposta: `{ status: string, imageUrl?: string }`

#### Gerenciamento de Exemplos

- **GET /load-examples**
  - Resposta: Array de exemplos
  
- **POST /create-example**
  - Requisição: Dados do formulário com imagem, título, descrição e categoria
  - Resposta: `{ success: true }`
  
- **DELETE /delete-example/:id**
  - Resposta: `{ success: true }`

#### Análise de Vídeo

- **POST /analyse-video**
  - Requisição: Dados do formulário com vídeo, PDF e descrição do desafio
  - Resposta: `{ analysis: string }` - Análise formatada em HTML

## Solução de Problemas

### Problemas Comuns

1. **Falha na implantação**
   - Verifique se suas credenciais AWS estão configuradas corretamente
   - Certifique-se de que todas as variáveis de ambiente necessárias estão definidas
   - Verifique se o processo de compilação foi concluído com sucesso

2. **Erros de compilação TypeScript**
   - Execute `npm run build` localmente para identificar erros de TypeScript
   - Corrija quaisquer problemas de tipo antes de tentar a implantação

3. **Erros de API**
   - Verifique os logs no CloudWatch na AWS para informações detalhadas de erro
   - Verifique se suas chaves de API são válidas e têm as permissões necessárias

### Logs

Quando implantado na AWS, os logs estão disponíveis no CloudWatch sob o grupo de logs da função Lambda.

Para desenvolvimento local, os logs aparecem no console.

---

Para ajuda adicional, entre em contato com a equipe de desenvolvimento.
