import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { getCurrentFileUrl } from '@vscode-use/utils'
import { workspace } from 'vscode'
import { isArray, useJSONParse } from 'lazy-js-utils'

const workspaceUrl = workspace.workspaceFolders![0].uri.path
export let alias: any = null

export async function getAlias() {
  let configUrl = ''
  if (fs.existsSync(path.resolve(workspaceUrl, 'tsconfig.json')))
    configUrl = path.resolve(workspaceUrl, 'tsconfig.json')
  else if (fs.existsSync(path.resolve(workspaceUrl, 'jsconfig.json')))
    configUrl = path.resolve(workspaceUrl, 'jsconfig.json')

  if (!configUrl)
    return

  const _config = useJSONParse(await fsp.readFile(configUrl, 'utf-8'))
  if (_config) {
    const paths = _config?.compilerOptions?.paths
    if (!paths)
      return
    alias = Object.keys(paths).reduce((result, key) => {
      let value = paths[key]
      if (isArray(value))
        value = value[0]
      result[key.replace(/\/\*\*/g, '').replace(/\/\*/g, '')] = value.replace(/\/\*\*/g, '').replace(/\/\*/g, '')
      return result
    }, {} as Record<string, string>)
  }
}

export function getAbsoluteUrl(url: string, suffix = '.vue', currentFileUrl = getCurrentFileUrl()) {
  let isUseAlia = false
  const end = url.split('/').slice(-1)[0].split('.')[1]
  if (end && end !== suffix.split('.')[1])
    return
  if (!end)
    url = `${url}${suffix}`

  if (alias) {
    Object.keys(alias).forEach((alia) => {
      url = url.replace(alia, () => {
        isUseAlia = true
        return alias[alia]
      })
    })
  }
  const absoluteUrl = isUseAlia
    ? path.resolve(workspaceUrl, '.', url)
    : path.resolve(currentFileUrl, '..', url)
  if (!end)
    return fs.existsSync(absoluteUrl) ? absoluteUrl : undefined

  return absoluteUrl
}

const suffix = ['.ts', '.js', '.tsx', '.jsx']
export function getAbsolute(url: string) {
  if (!url)
    return getCurrentFileUrl()

  for (const s of suffix) {
    const target = getAbsoluteUrl(url, s)
    if (target)
      return target
  }

  for (const s of suffix) {
    const target = getAbsoluteUrl(`${url}/index`, s)
    if (target)
      return target
  }
}
