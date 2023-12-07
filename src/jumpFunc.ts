import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { languages, window } from 'vscode'
import { getCurrentFileUrl, jumpToLine } from '@vscode-use/utils'
import type { Position } from 'vscode'

export function jumpFunc(contextMap: any) {
  return languages.registerDefinitionProvider([
    { scheme: 'file', language: 'vue' },
  ], {
    provideDefinition(document, position) {
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
      if (Array.isArray(target))
        jumpToLine(target[0], getAbsolute(target[1]))
      else
        jumpToLine(target)
    },
  })
}

function getFuncName(lineText: string, position: Position) {
  const pos = position.character
  let i = pos - 1
  let pre = lineText[i]
  let prefix = ''
  while (!/[\s",\(\)]/.test(pre) && i >= 0) {
    prefix = `${pre}${prefix}`
    pre = lineText[--i]
  }
  let j = pos
  let suf = lineText[j]
  let suffix = ''
  const maxLen = lineText.length - 1
  while (!/[\s",\(\)]/.test(suf) && j < maxLen) {
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

const suffix = ['.ts', '.js', '.tsx', '.jsx']
function getAbsolute(url: string) {
  url = resolve(getCurrentFileUrl(), '..', url)
  if (/.(ts|js|tsx|jsx)$/.test(url))
    return url
  for (const s of suffix) {
    const _url = `${url}${s}`
    if (existsSync(_url))
      return _url
  }
  for (const s of suffix) {
    const _url = `${url}/index${s}`
    if (existsSync(_url))
      return _url
  }
}
