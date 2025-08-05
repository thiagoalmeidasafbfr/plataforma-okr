# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Metas e Resultados

As metas e seus resultados mensais são lidos de planilhas CSV colocadas em `public/data`.
Para atualizar as informações exibidas na plataforma, basta editar os arquivos
`metas.csv` e `resultados.csv` e realizar um `git push`.

Formato esperado de `metas.csv`:

```
idMeta,tipoMeta,diretoria,area,objetivo,kr,peso
1,Financeiro,Diretoria A,Area A,Aumentar receita,KR1,100
```

Formato esperado de `resultados.csv`:

```
idMeta,mes,resultado
1,2024-01,50
```
