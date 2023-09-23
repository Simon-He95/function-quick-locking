import { getActiveText, getActiveTextEditorLanguageId } from '@vscode-use/utils'
import { parse } from '@vue/compiler-sfc'

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
      const scriptTemplate = script || scriptSetup
    }
  }
}

export function deactivate() {

}
