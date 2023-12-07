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
import { parserDefault, parserNotSetup, parserSetup } from './vue'
import { parserJavascript } from './javascript'
import { jumpFunc } from './jumpFunc'
import { renderJavascriptTree, renderTree } from './treeProvider'
import { getAlias } from './utils'

export function activate(context: ExtensionContext) {
  const contextMap: any = {}
  getAlias()
  context.subscriptions.push(registerCommand('function-quick-locking.jump', (data, baseLine) => {
    jumpToLine(baseLine !== undefined ? data.start.line + baseLine - 1 : data.start.line)
  }))

  const updateTree = () => {
    try {
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
          let type: 0 | 1 | 2 = 0
          try {
            if (scriptSetup) {
              type = 0
              data = parserSetup(tsParser(scriptSetup.content, { jsx: true, loc: true, range: true }))
            }
            else if (script && script.content.includes('export default defineComponent')) {
              data = parserNotSetup(tsParser(script.content, { jsx: true, loc: true, range: true }))
              type = 1
            }
            else if (script) {
              data = parserDefault(tsParser(script.content, { jsx: true, loc: true, range: true }))
              type = 2
            }

            if (!data)
              return
            // 1.将数据渲染到侧边栏，以树形式，展示methods，props，computed；2. 监听点击事件，跳转对应代码行数，
            if (!contextMap.vueTreeProvider)
              contextMap.vueTreeProvider = renderTree({ ...data, code, baseLine: (script || scriptSetup)?.loc.start.line, baseOffset: (script || scriptSetup)?.loc.start.offset }, type)
            else
              contextMap.vueTreeProvider.update({ ...data, code, baseLine: (script || scriptSetup)?.loc.start.line, baseOffset: (script || scriptSetup)?.loc.start.offset }, type)
          }
          catch (error) {
            if (!contextMap.vueTreeProvider)
              contextMap.vueTreeProvider = renderTree({}, type)
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
    catch (error) {

    }
  }

  updateTree()

  context.subscriptions.push(addEventListener('activeText-change', () => updateTree()))

  context.subscriptions.push(addEventListener('text-save', () => updateTree()))

  context.subscriptions.push(jumpFunc(contextMap))
}

export function deactivate() {

}
