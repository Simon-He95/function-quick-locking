import {
  addEventListener,
  getActiveText,
  getActiveTextEditorLanguageId,
  getCurrentFileUrl,
  jumpToLine,
  registerCommand,
} from '@vscode-use/utils'
import { parse } from '@vue/compiler-sfc'
import { parse as tsParser } from '@typescript-eslint/typescript-estree'
import type { ExtensionContext } from 'vscode'
import { parserDefault, parserSetup } from './vue'
import { parserJavascript } from './javascript'
import { jumpFunc } from './jumpFunc'
import { renderJavascriptTree, renderTree } from './treeProvider'

export function activate(context: ExtensionContext) {
  const contextMap: any = {}

  context.subscriptions.push(registerCommand('function-quick-locking.jump', (data, baseLine) => {
    jumpToLine(baseLine !== undefined ? data.start.line + baseLine - 1 : data.start.line)
  }))

  const updateTree = () => {
    const lan = getActiveTextEditorLanguageId()
    if (getCurrentFileUrl().endsWith('.d.ts'))
      return
    const code = getActiveText()
    if (!code)
      return
    switch (lan) {
      case 'vue': {
        // todo: 支持vue3 非script setup的情况
        const { descriptor: { styles, template, script, scriptSetup }, errors } = parse(code)
        if (errors.length)
          return
        let data

        try {
          if (scriptSetup)
            data = parserSetup(tsParser(scriptSetup.content, { jsx: true, loc: true }))
          else if (script)
            data = parserDefault(tsParser(script.content, { jsx: true, loc: true }))

          if (!data)
            return
          // 1.将数据渲染到侧边栏，以树形式，展示methods，props，computed；2. 监听点击事件，跳转对应代码行数，
          if (!contextMap.vueTreeProvider)
            contextMap.vueTreeProvider = renderTree({ ...data, code, baseLine: (script || scriptSetup)?.loc.start.line }, !!scriptSetup)
          else
            contextMap.vueTreeProvider.update({ ...data, code, baseLine: (script || scriptSetup)?.loc.start.line }, !!scriptSetup)
        }
        catch (error) {
          if (!contextMap.vueTreeProvider)
            contextMap.vueTreeProvider = renderTree({}, !!scriptSetup)
          else
            contextMap.vueTreeProvider.update({}, !!scriptSetup)
        }
        break
      }
      case 'typescript':
      case 'javascript': {
        const data = parserJavascript(tsParser(code, { jsx: true, loc: true }))
        if (!contextMap.javascriptTreeProvider)
          contextMap.javascriptTreeProvider = renderJavascriptTree(data)
        else
          contextMap.javascriptTreeProvider.update(data)
      }
    }
  }

  updateTree()

  context.subscriptions.push(addEventListener('activeText-change', () => updateTree()))

  context.subscriptions.push(addEventListener('text-save', () => updateTree()))

  context.subscriptions.push(jumpFunc(contextMap))
}

export function deactivate() {

}
