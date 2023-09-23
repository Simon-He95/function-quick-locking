import type { AST } from '@typescript-eslint/typescript-estree'

export type VueAst = AST<{ jsx: true; loc: true }>
