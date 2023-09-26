import { addEventListener, getActiveText, getActiveTextEditorLanguageId, jumpToLine, registerCommand } from '@vscode-use/utils'
import { parse } from '@vue/compiler-sfc'
import { parse as tsParser } from '@typescript-eslint/typescript-estree'
import type { ExtensionContext } from 'vscode'
import { parserDefault, parserSetup } from './vue'
import { parserJavascript } from './javascript'
import { renderJavascriptTree, renderTree } from './treeProvider'

export function activate(context: ExtensionContext) {
  let vueTreeProvider: any = null
  let javascriptTreeProvider: any = null
  context.subscriptions.push(registerCommand('function-quick-locking.jump', (data, baseLine) => {
    jumpToLine(baseLine !== undefined ? data.start.line + baseLine - 1 : data.start.line)
  }))
  const updateTree = () => {
    const lan = getActiveTextEditorLanguageId()
    const code = getActiveText()
    if (!code)
      return
    switch (lan) {
      case 'vue': {
        const { descriptor: { styles, template, script, scriptSetup }, errors } = parse(code)
        if (errors.length)
          return
        let data
        if (scriptSetup)
          data = parserSetup(tsParser(scriptSetup.content, { jsx: true, loc: true }))
        else if (script)
          data = parserDefault(tsParser(script.content, { jsx: true, loc: true }))
        if (!data)
          return
        // 1.将数据渲染到侧边栏，以树形式，展示methods，props，computed；2. 监听点击事件，跳转对应代码行数，
        if (!vueTreeProvider)
          vueTreeProvider = renderTree({ ...data, baseLine: (script || scriptSetup)?.loc.start.line }, context, !!scriptSetup)
        else
          vueTreeProvider.update({ ...data, baseLine: (script || scriptSetup)?.loc.start.line }, !!scriptSetup)
        break
      }
      case 'typescript':
      case 'javascript': {
        const data = parserJavascript(tsParser(code, { jsx: true, loc: true }))
        if (!javascriptTreeProvider)
          javascriptTreeProvider = renderJavascriptTree(data, context)
        else
          javascriptTreeProvider.update(data)
      }
    }
  }
  updateTree()
  context.subscriptions.push(addEventListener('activeText-change', () => {
    updateTree()
  }))

  context.subscriptions.push(addEventListener('text-save', () => {
    updateTree()
  }))
}

export function deactivate() {

}
