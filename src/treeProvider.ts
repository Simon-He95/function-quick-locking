import { TreeProvider } from '@vscode-use/treeprovider'
import { jumpToLine, registerCommand } from '@vscode-use/utils'
import type { TreeData } from '@vscode-use/treeprovider'
import type { ExtensionContext } from 'vscode'
import * as vscode from 'vscode'

export function renderTree(data: any, context: ExtensionContext) {
  const { methods, computed, baseLine } = data
  const treeData: TreeData = []
  // treeData.push({
  //   label: 'methods',
  //   collapsed: true,
  //   iconPath:new vscode.ThemeIcon('symbol-module'),
  //   children: Object.keys(methods).map(method => {
  //     return {
  //       label: method,
  //       iconPath: new vscode.ThemeIcon('symbol-method'),
  //       command: {
  //         title: method,
  //         command: 'function-quick-locking.jump',
  //         arguments: [methods[method].locs],
  //       }
  //     }
  //   })
  // })
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

    // Object.keys(methods).map(method => {
    //   return {
    //     label: method,
    //     iconPath: new vscode.ThemeIcon('symbol-method'),
    //     command: {
    //       title: method,
    //       command: 'function-quick-locking.jump',
    //       arguments: [methods[method].locs],
    //     }
    //   }
    // })
  })

  treeData.push({
    label: 'computed',
    collapsed: true,
    iconPath: new vscode.ThemeIcon('symbol-module'),
    children: computed.value.map((item: any) => {
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
  context.subscriptions.push(registerCommand('function-quick-locking.jump', (data, baseLine) => {
    jumpToLine(data.start.line + baseLine - 1)
  }))
  const provider = new TreeProvider(treeData)
  context.subscriptions.push(vscode.window.registerTreeDataProvider('function-quick-locking.id', provider))
}
