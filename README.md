# Ponto por Foto

Sistema de controle de ponto com verificação de localização e foto, focado em pequenas lojas.

## Funcionalidades
- Bater ponto com foto (usando câmera do celular).
- Verificação de geolocalização (raio da loja).
- Painel Administrativo.
- Geração de planilha Excel (SheetJS).

## Como Configurar

1. **Banco de Dados (PostgreSQL)**
   - Recomendamos criar um banco de dados no **Neon** ou usar o **Vercel Postgres**.
   - Pegue a URL de conexão e adicione ao `.env`:
     ```env
     DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
     ```

2. **Armazenamento de Fotos (Vercel Blob)**
   - No painel da Vercel, crie um novo Blob Storage.
   - Siga as instruções e adicione os tokens no `.env`:
     ```env
     BLOB_READ_WRITE_TOKEN="seu_token_aqui"
     ```

3. **Rodar as Migrations**
   - Com o banco conectado, rode:
     ```bash
     npx prisma migrate dev --name init
     ```

4. **Rodar Localmente**
   ```bash
   npm run dev
   ```

## Deploy na Vercel
1. Conecte o repositório GitHub na Vercel.
2. Adicione as variáveis de ambiente `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN`.
3. O build (`npm run build`) será feito automaticamente.
