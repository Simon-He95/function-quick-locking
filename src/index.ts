import { getActiveText, getActiveTextEditorLanguageId } from '@vscode-use/utils'
import { parse } from '@vue/compiler-sfc'
import { parse as tsParser } from '@typescript-eslint/typescript-estree'
import { parserDefault, parserSetup } from './vue'

export function activate() {
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
    }
  }
}

export function deactivate() {

}
