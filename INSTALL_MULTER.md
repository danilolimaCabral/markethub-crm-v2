# Instalar Dependência Multer

Para habilitar a funcionalidade de upload de planilhas, é necessário instalar o pacote `multer`.

## Instalação

Execute o seguinte comando na raiz do projeto:

```bash
pnpm add multer
pnpm add -D @types/multer
```

## O que é Multer?

Multer é um middleware Node.js para manipulação de `multipart/form-data`, usado principalmente para upload de arquivos.

## Uso no Projeto

O multer é usado na rota `/api/spreadsheet-validation` para:
- Upload de arquivos Excel (.xlsx, .xls)
- Upload de arquivos CSV (.csv)
- Validação de tipo de arquivo
- Limite de tamanho (10MB)

## Alternativa

Se preferir não instalar o multer, você pode usar outra biblioteca de upload como:
- `formidable`
- `busboy`
- `express-fileupload`

Neste caso, será necessário ajustar o código em `server/routes/spreadsheet-validation.ts`.
