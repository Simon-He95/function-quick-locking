import { renderTree as render } from '@vscode-use/treeprovider'
import type { TreeData } from '@vscode-use/treeprovider'
import * as vscode from 'vscode'

export function renderTree(data: any, type: 0 | 1 | 2) {
  let treeData: TreeData = filterEmptyChildren(
    type === 0
      ? generateSetupTreeData(data)
      : type === 1
        ? generateNotSetupTreeData(data)
        : generateTreeData(data),
  )
  const { update } = render(treeData, 'function-quick-locking.id')
  return {
    update(data: any, type: 0 | 1 | 2) {
      this.type = type

      this.treeData = treeData = filterEmptyChildren(
        type === 0
          ? generateSetupTreeData(data)
          : type === 1
            ? generateNotSetupTreeData(data)
            : generateTreeData(data))
      update(treeData)
    },
    treeData,
    type,
  }
}

function generateTreeData(content: any) {
  const treeData: TreeData = []
  const { methods, computed, props, baseLine, data, components } = content
  if (methods) {
    treeData.push({
      label: 'methods',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: methods.value.map((item: any) => {
        let label = item.key.name
        const params = item.value.type === 'Identifier' ? item.value.name : item.value.params.map((item: any) => item.name).join(',')
        const name = label
        label += `    --->    (${params}) => {}`
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('symbol-method'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (computed) {
    treeData.push({
      label: 'computed',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: computed.value.map((item: any) => {
        let label = ''
        let params = ''
        if (item.type === 'SpreadElement') {
          label = item.argument.callee.name
          params = item.argument.arguments.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else {
          label = item.key.name
          params = item.value.type === 'FunctionExpression' ? item.value.params.map((u: any) => u.key.name).join(',') : item.value.properties.map((u: any) => u.key.name).join(',')
        }
        const name = label
        label += `    --->    (${params}) => {}`

        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('symbol-method'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (props) {
    treeData.push({
      label: 'props',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: props.value.map((item: any) => {
        const labelDefault = getValue(item.value)
        const name = item.key.name
        const label = `${item.key.name}   --->    ${JSON.stringify(labelDefault)}`
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('variable'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (data) {
    treeData.push({
      label: 'data',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: data.value.map((item: any) => {
        const labelDefault = getValue(item.value)
        const name = item.key.name
        const label = `${item.key.name}   --->   ${JSON.stringify(labelDefault)}`
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('variable'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (components) {
    treeData.push({
      label: 'components',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: components.value.map((item: any) => {
        const label = item.key.name
        return {
          name: label,
          label,
          iconPath: new vscode.ThemeIcon('variable'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  return treeData
}

function generateSetupTreeData(data: any) {
  const treeData: TreeData = []
  const { methods, importer, baseLine, variables } = data
  if (methods && methods.length) {
    treeData.push({
      label: 'methods',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: methods.map((item: any) => {
        let label = ''
        let params = ''
        const type = item.type
        if (type === 'ExpressionStatement') {
          label = item.expression.callee.name
          params = item.expression.arguments.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'FunctionDeclaration') {
          label = item.id.name
          params = item.params.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'VariableDeclaration') {
          label = item.declarations[0].id.name
          try {
            params = getValue(item.declarations[0])
          }
          catch (error) {
            const [start, end] = item.range
            params = data.code.slice(data.baseOffset + start, data.baseOffset + end)
          }
        }
        const name = label
        label += `    --->    (${params}) => {}`
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('symbol-method'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (variables && variables.length) {
    treeData.push({
      label: 'variable',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: variables.map((item: any) => {
        let label = ''
        const type = item.type
        if (type === 'ExpressionStatement') { label = item.expression.callee.name }
        else if (type === 'FunctionDeclaration') { label = item.id.name }
        else if (type === 'VariableDeclaration') {
          const declarationName = item.declarations[0].id
          if (declarationName.type === 'ObjectPattern')
            label = `{ ${declarationName.properties.map((i: any) => i.key.name).join(', ')} }`
          else
            label = declarationName.name
        }
        let labelDefault
        try {
          labelDefault = getValue(item, label)
        }
        catch (error) {
          const [start, end] = item.range
          labelDefault = data.code.slice(data.baseOffset + start, data.baseOffset + end)
        }
        const name = label
        label += `   --->    ${JSON.stringify(labelDefault)}`
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('variable'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (importer) {
    treeData.push({
      label: 'importer',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: importer.map((item: any) => {
        let isDefault = false
        const names: string[] = []
        const specifiers = item.specifiers
        const from = item.source.value
        specifiers.forEach((cur: any) => {
          if (cur.type === 'ImportDefaultSpecifier')
            isDefault = true

          names.push(cur.local.name)
        })
        const label = isDefault
          ? `import ${names[0]} from ${from}`
          : `import { ${names.join(',')} } from ${from}`
        return {
          label,
          iconPath: new vscode.ThemeIcon('extensions'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  return treeData
}

function generateNotSetupTreeData(data: any) {
  const treeData: TreeData = []
  const { functions, returnStatement, baseLine, variables } = data
  if (variables && variables.length) {
    treeData.push({
      label: 'variable',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: variables.map((item: any) => {
        let label = ''

        const type = item.type
        if (type === 'ExpressionStatement') { label = item.expression.callee.name }
        else if (type === 'FunctionDeclaration') { label = item.id.name }
        else if (type === 'VariableDeclaration') {
          const declarationName = item.declarations[0].id
          if (declarationName.type === 'ObjectPattern')
            label = `{ ${declarationName.properties.map((i: any) => i.key.name).join(', ')} }`
          else
            label = declarationName.name
        }
        else if (type === 'VariableDeclarator') {
          if (item.id.type === 'ObjectPattern')
            label = item.id.properties[0].key.name
          else
            label = item.id.name
        }
        let labelDefault
        try {
          labelDefault = getValue(item, label)
        }
        catch (error) {
          const [start, end] = item.range
          labelDefault = data.code.slice(data.baseOffset + start, data.baseOffset + end)
        }
        const name = label
        label += `   --->    ${JSON.stringify(labelDefault)}`
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('variable'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (functions && functions.length) {
    treeData.push({
      label: 'functions',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: functions.map((item: any) => {
        let label = ''
        let params = ''
        const type = item.type
        if (type === 'ExpressionStatement') {
          label = item.expression.callee.name
          params = item.expression.arguments.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'FunctionDeclaration') {
          label = item.id.name
          params = item.params.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'VariableDeclaration') {
          label = item.declarations[0].id.name
          params = getValue(item.declarations[0])
        }
        const name = label
        label += `    --->    (${params}) => {}`
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('symbol-method'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  if (returnStatement && returnStatement.length) {
    treeData.push({
      label: 'returnStatement',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: returnStatement.map((item: any) => {
        let label = ''
        let params = ''
        const type = item.type
        if (type === 'ExpressionStatement') {
          label = item.expression.callee.name
          params = item.expression.arguments.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'FunctionDeclaration') {
          label = item.id.name
          params = item.params.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'VariableDeclaration') {
          label = item.declarations[0].id.name
          params = getValue(item.declarations[0])
        }
        else if (type === 'Property') {
          label = item.key.name
        }
        const name = label
        return {
          name,
          label,
          iconPath: new vscode.ThemeIcon('symbol-method'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc, baseLine],
          },
        }
      }),
    })
  }

  return treeData
}

function getValue(data: any, label = ''): any {
  const type = data?.type
  if (!type)
    return data
  if (type === 'ObjectExpression') {
    return data.properties.reduce((result: any, item: any) => {
      const name = item.key.name
      const val = getValue(item.value)
      result[name] = val
      return result
    }, {})
  }
  else if (type === 'Literal') {
    return data.value
  }
  else if (type === 'Identifier') {
    return data.name
  }
  else if (type === 'ArrayExpression') {
    return data.elements.map(getValue) || []
  }
  else if (type === 'MemberExpression') {
    if (data.property) {
      const pre: any = getValue(data.object)
      return `${pre ? `${pre}.` : 'this.'}${data.property.name}`
    }
  }
  else if (type === 'FunctionExpression') {
    return getValue(data.body.body[0].argument)
  }
  else if (type === 'CallExpression') {
    return `${data.callee.name}(${data.arguments.map(getValue).reduce((result: string, cur: any) =>
      result
        ? `${result},${JSON.stringify(cur)}`
        : JSON.stringify(cur)
      , '')})`
  }
  else if (type === 'ArrowFunctionExpression') {
    return `(${data.params.map((item: any) => item.name).join(',')}) => {}`
  }
  else if (type === 'VariableDeclaration') {
    return `${data.kind} ${label || data.declarations[0].id.name} = ${getValue(data.declarations[0].init)}`
  }
  else if (type === 'VariableDeclarator') {
    return `${data.init.callee.name}(${getValue(data.init.arguments[0])})`
  }
  else {
    return ''
  }
}

export function renderJavascriptTree(data: any) {
  let treeData: TreeData = filterEmptyChildren(generateJavascriptTreeData(data))
  const { update } = render(treeData, 'function-quick-locking.id')

  return {
    update(data: any) {
      treeData = filterEmptyChildren(generateJavascriptTreeData(data))
      update(treeData)
    },
  }
}

function generateJavascriptTreeData(data: any) {
  const treeData: TreeData = []
  const { importer, exporter, methods } = data
  if (methods) {
    treeData.push({
      label: 'methods',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: methods.map((item: any) => {
        let label = ''
        let params = ''
        const type = item.type
        if (type === 'ExpressionStatement') {
          label = item.expression.callee.name
          params = item.expression.arguments.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'FunctionDeclaration') {
          label = item.id.name
          params = item.params.map(getValue).reduce((result: string, cur: any) =>
            result
              ? `${result},${JSON.stringify(cur)}`
              : JSON.stringify(cur)
          , '')
        }
        else if (type === 'VariableDeclaration') {
          label = item.declarations[0].id.name
          params = getValue(item.declarations[0])
        }
        else if (type === 'ExportNamedDeclaration') {
          if (item.declaration.type === 'FunctionDeclaration') {
            label = item.declaration.id.name
            params = item.declaration.params.map(getValue).reduce((result: string, cur: any) =>
              result
                ? `${result},${JSON.stringify(cur)}`
                : JSON.stringify(cur)
            , '')
          }
          else {
            label = item.declaration.declarations[0].id.name
            params = getValue(item.declaration.declarations[0].init)
          }
        }
        label += `    --->    (${params}) => {}`
        return {
          label,
          iconPath: new vscode.ThemeIcon('symbol-method'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.loc],
          },
        }
      }),
    })
  }
  return treeData
}

function filterEmptyChildren(data: any) {
  return data.filter((item: any) => item.children && item.children.length)
}
