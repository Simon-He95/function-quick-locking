import type { VueAst } from './type'

export function parserSetup(ast: VueAst) {
  const body = ast.body
  const importer: any[] = []
  const methods: any = {}
  const variable: any = {}
  body.forEach((item: any) => {
    const { type } = item
    const locs: any[] = []
    if (type === 'ImportDeclaration') {
      importer.push(item)
    }
    else if (type === 'ExpressionStatement') {
      const name = item.expression?.callee?.name
      if (!name)
        return
      locs.push(item.expression?.loc)
      methods[name] = {
        type,
        locs,
        value: item.expression.arguments[0],
      }
    }
    else if (type === 'FunctionDeclaration') {
      const name = item.id.name
      locs.push(item.loc)
      methods[name] = {
        type,
        locs,
        value: item.body.body,
      }
    }
    else if (type === 'VariableDeclaration') {
      const name = item.declarations[0].id.name
      locs.push(item.loc)
      variable[name] = {
        type,
        locs,
        value: item.declarations[0].init,
      }
    }
  })
  return {
    importer,
    methods,
    variable,
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
    let { type, value, properties } = property.value
    const locs: any[] = [property.loc]
    if (type === 'ObjectExpression') {
      value = properties
      locs.push(properties.map((item: any) => item.loc))
    }

    result[name] = {
      value,
      locs,
      type: property.value.type,
    }
  })
  return result
}
