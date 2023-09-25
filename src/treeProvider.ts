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
  const { methods, importer, type, baseLine } = data
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
  return treeData
}

const temp = ''
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
  else {
    return ''
  }
}
