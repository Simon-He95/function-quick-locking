import type { VueAst } from './type'

export function parserSetup(ast: VueAst) {
  const body = ast.body
  const importer: any[] = []
  const methods: any = []
  const variables: any = []
  body.forEach((item: any) => {
    const { type } = item
    if (type === 'ImportDeclaration') {
      importer.push(item)
    }
    else if (type === 'ExpressionStatement') {
      const name = item.expression?.callee?.name
      if (!name)
        return
      methods.push(item)
    }
    else if (type === 'FunctionDeclaration') {
      methods.push(item)
    }
    else if (type === 'VariableDeclaration') {
      if (item.declarations?.[0]?.init?.type === 'ArrowFunctionExpression' || item.declarations?.[0]?.init?.type === 'FunctionExpression')
        methods.push(item)
      else
        variables.push(item)
    }
  })
  return {
    importer,
    methods,
    variables,
  }
}

export function parserDefault(ast: VueAst) {
  const body = ast.body
  const target = body.find(item => item.type === 'ExportDefaultDeclaration') as any
  if (!target)
    return
  const result: any = {}
  target.declaration.properties.forEach((property: any) => {
    const name = property.key.name
    let { type, value, properties, body } = property.value
    if (type === 'ObjectExpression')
      value = properties

    else if (name === 'data' && type === 'FunctionExpression')
      value = body.body.find((item: any) => item.type === 'ReturnStatement').argument.properties

    result[name] = {
      value,
      type: property.value.type,
    }
  })
  return result
}
