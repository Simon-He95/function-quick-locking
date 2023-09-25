import { renderTree as render } from '@vscode-use/treeprovider'
import { jumpToLine, registerCommand } from '@vscode-use/utils'
import type { TreeData } from '@vscode-use/treeprovider'
import type { ExtensionContext } from 'vscode'
import * as vscode from 'vscode'

export function renderTree(data: any, context: ExtensionContext, isSetup?: boolean) {
  const treeData: TreeData = isSetup ? generateSetupTreeData(data) : generateTreeData(data)
  context.subscriptions.push(registerCommand('function-quick-locking.jump', (data, baseLine) => {
    jumpToLine(data.start.line + baseLine - 1)
  }))
  const { update } = render(treeData, 'function-quick-locking.id')

  return {
    update(data: any, isSetup?: boolean) {
      const newTreeData = isSetup ? generateSetupTreeData(data) : generateTreeData(data)
      update(newTreeData)
    },
  }
}

function generateTreeData(content: any) {
  const treeData: TreeData = []
  const { methods, computed, props, baseLine, data } = content
  if (methods) {
    treeData.push({
      label: 'methods',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: methods.value.map((item: any) => {
        const label = item.key.name
        return {
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
        const label = item.type === 'SpreadElement'
          ? item.argument.callee.name
          : item.key.name
        return {
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
        const label = `${item.key.name}   --->    ${JSON.stringify(labelDefault)}`
        return {
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
        const label = `${item.key.name}   --->   ${JSON.stringify(labelDefault)}`
        return {
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
  const { methods, importer, type, baseLine, variable } = data
  if (methods) {
    treeData.push({
      label: 'methods',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: Object.keys(methods).map((label) => {
        const item = methods[label]
        const loc = Array.isArray(item.value) ? item.value[0].loc : item.value.loc
        return {
          label,
          iconPath: new vscode.ThemeIcon('symbol-method'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [loc, baseLine],
          },
        }
      }),
    })
  }
  if (variable) {
    treeData.push({
      label: 'variable',
      collapsed: true,
      iconPath: new vscode.ThemeIcon('symbol-module'),
      children: Object.keys(variable).map((key) => {
        const item = variable[key]
        const labelDefault = getValue(item.value)
        const label = `${key}   --->    ${JSON.stringify(labelDefault)}`
        return {
          label,
          iconPath: new vscode.ThemeIcon('variable'),
          command: {
            title: label,
            command: 'function-quick-locking.jump',
            arguments: [item.value.loc, baseLine],
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

function getValue(data: any) {
  const type = data.type
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
    return data.elements.map(getValue)
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
  else {
    return ''
  }
}
