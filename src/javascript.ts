import type { VueAst } from './type'

export function parserJavascript(ast: VueAst) {
  const importer: any[] = []
  const exporter: any[] = []
  const methods: any[] = []

  const body = ast.body
  body.forEach((item: any) => {
    const type = item.type
    if (type === 'FunctionDeclaration') {
      methods.push(item)
    }
    else if (type === 'ExportNamedDeclaration') {
      if (item.declaration?.declarations?.[0].init?.type === 'ArrowFunctionExpression' || item.declaration.declarations?.[0]?.init?.type === 'FunctionExpression')
        methods.push(item)

      exporter.push(item)
    }
    else if (type === 'ImportDeclaration') {
      importer.push(item)
    }
    else if (type === 'VariableDeclaration') {
      if (item.declarations?.[0]?.init?.type === 'ArrowFunctionExpression' || item.declarations?.[0]?.init?.type === 'FunctionExpression')
        methods.push(item)
    }
  })
  return {
    importer,
    exporter,
    methods,
  }
}
