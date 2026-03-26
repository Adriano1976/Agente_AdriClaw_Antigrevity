# Padrões por Stack

## Next.js (App Router)

```
src/
├── app/                    ← Apenas páginas e layouts (roteamento)
│   └── dashboard/
│       ├── page.tsx        (< 60 linhas — só composição)
│       └── layout.tsx
├── components/
│   └── Dashboard/
│       ├── Dashboard.tsx
│       ├── Dashboard.types.ts
│       └── index.ts        (barrel)
├── hooks/
├── services/
├── utils/
└── types/
```

**Regra Next.js:** `page.tsx` e `layout.tsx` devem ter apenas imports e composição — zero lógica de negócio.

---

## Vite + React

```
src/
├── pages/           ← Composição de features
├── features/        ← Agrupamento por domínio
│   └── cart/
│       ├── CartPage.tsx
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
├── shared/          ← Reutilizável entre features
│   ├── components/
│   ├── hooks/
│   └── utils/
└── types/           ← Tipos globais
```

**Regra Vite:** Prefira organização por feature (vertical slicing) em vez de por tipo (horizontal slicing).

---

## NestJS

```
src/
├── modules/
│   └── users/
│       ├── users.module.ts       (< 30 linhas)
│       ├── users.controller.ts   (< 100 linhas — só rotas)
│       ├── users.service.ts      (< 200 linhas — lógica)
│       ├── users.repository.ts   (< 150 linhas — DB)
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   └── update-user.dto.ts
│       └── entities/
│           └── user.entity.ts
└── common/
    ├── decorators/
    ├── guards/
    └── interceptors/
```

**Regra NestJS:** Controller nunca acessa repositório diretamente. Service nunca conhece HTTP.

---

## Monorepo (Turborepo / Nx)

```
packages/
├── ui/              ← Componentes compartilhados
├── utils/           ← Funções puras compartilhadas
├── types/           ← Tipos compartilhados
└── config/          ← Configs (eslint, tsconfig)
apps/
├── web/
└── mobile/
```

**Regra monorepo:** Tipos compartilhados entre apps vão em `packages/types`, nunca duplicados.

---

## Critério de Divisão por Responsabilidade

| Sinal no código | Ação recomendada |
|----------------|-----------------|
| `useEffect` + JSX complexo no mesmo arquivo | Extrair hook |
| `fetch`/`axios` dentro de componente | Extrair service |
| > 5 interfaces/types inline | Extrair `.types.ts` |
| Componente com > 3 subcomponentes internos | Extrair para `components/` |
| Funções com > 20 linhas cada | Extrair para `utils/` |
| Estado global com `useState` em múltiplos lugares | Considerar Context ou Zustand |
