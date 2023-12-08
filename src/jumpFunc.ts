import { languages, window } from 'vscode'
import { jumpToLine } from '@vscode-use/utils'
import type { Position } from 'vscode'

export function jumpFunc(contextMap: any) {
  return languages.registerDefinitionProvider([
    { scheme: 'file', language: 'vue' },
  ], {
    async provideDefinition(document, position) {
      const uri = window.activeTextEditor?.document.uri.fsPath
      if (!uri)
        return
      const { vueTreeProvider } = contextMap
      if (!vueTreeProvider || vueTreeProvider.type === 'setup')
        return
      const lineText = document.lineAt(position).text // 当前行字符串
      const { funName, start, end } = getFuncName(lineText, position)

      if (funName.includes(' '))
        return
      const target = findTarget(funName, vueTreeProvider.treeData)
      if (target === undefined)
        return
      if (Array.isArray(target)) {
        // target[1] 有值要更新跳转的行数
        if (!target[1])
          jumpToLine(target[0] - 1)

        // const url = getAbsolute(target[1])
        // if (!url)
        // return
        // else {
        //   const content = await fsp.readFile(url, 'utf-8')
        //   const ast = parse(content, { jsx: true, typescript: true, loc: true })
        //   for (const b of ast.body) {
        //     const declaration = (b as any).declaration
        //     if (b.type === 'ExportNamedDeclaration') {
        //       if (declaration && declaration.type === 'VariableDeclaration' && declaration.declarations[0].id.name === funName) {
        //         jumpToLine(b.loc.start.line - 1, url)
        //         return
        //     }
        //   }
        // }
        // }
      }
      else { jumpToLine(target) }
    },
  })
}

function getFuncName(lineText: string, position: Position) {
  const pos = position.character
  let i = pos - 1
  let pre = lineText[i]
  let prefix = ''
  while (!/[\s",\(\){}]/.test(pre) && i >= 0) {
    prefix = `${pre}${prefix}`
    pre = lineText[--i]
  }
  let j = pos
  let suf = lineText[j]
  let suffix = ''
  const maxLen = lineText.length - 1
  while (!/[\s",\(\){}]/.test(suf) && j < maxLen) {
    suffix += suf
    suf = lineText[++j]
  }
  const name = `${prefix}${suffix}`.trim()
  const funName = name.split('(')[0]
  return {
    funName,
    name,
    start: i,
    end: j + 1,
  }
}

function findTarget(funName: string, data: any) {
  if (!data || !data.length)
    return
  for (const item of data) {
    const children = item.children
    const target = children.find((child: any) =>
      child.names ? child.names.includes(funName) : child.name === funName,
    )
    if (target) {
      const data = target.command.arguments
      if (target.names)
        return [data[0].start.line + data[1] - 1, data[2]]

      return data[0].start.line + data[1] - 1
    }
  }
}
