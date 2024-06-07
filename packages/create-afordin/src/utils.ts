import path, {resolve} from 'node:path'
import fs from 'node:fs'
import {fileURLToPath} from 'node:url'

import {DEFAULT_FOLDER} from './const.js'

export function args () {
  return process.argv.slice(2).reduce(
    (acc, item, i, arr) => {
      const isFlag = item.startsWith('--')

      if (isFlag) {
        const flagValue = arr.splice(i + 1, 1).shift()

        const flag = item.slice(2)
        acc[flag] = flagValue
      } else {
        acc._.push(item)
      }

      return acc
    },
    {_: []} as Record<string, any>,
  )
}

export async function catchify (promise: Promise<any>) {
  return await promise.then(d => [null, d]).catch(e => [e, null])
}

export function targetDirectory (targetDirectory: string | undefined): [string, boolean] {
  const directory = targetDirectory?.trim().replace(/\/+$/g, '')
  return [directory || DEFAULT_FOLDER, !Boolean(directory)]
}

export function getProjectName (directory: string) {
  return directory === '.' ? path.basename(path.resolve()) : directory
}

export function isEmptyDirectory (targetDir: string) {
  return !fs.existsSync(targetDir) || isEmpty(targetDir)
}

export function isEmpty (path: string) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

/**
 * Create or overwrite folder root
 *
 * @param root
 * @param overwrite
 * @returns
 */
export function folderDirectory (root: string, overwrite = false) {
  console.log(root)

  if (overwrite) return emptyDirectory(root)

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, {recursive: true})
  }
}

function emptyDirectory (dir: string) {
  if (!fs.existsSync(dir)) return

  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') continue

    fs.rmSync(path.resolve(dir, file), {recursive: true, force: true})
  }
}

export function getTemplateDirectory (path: string) {
  const templateDir = resolve(fileURLToPath(import.meta.url), '../..', 'src/templates', path)
  if (!fs.existsSync(templateDir)) throw new Error('No existe template')

  return templateDir
}

export function isValidPackageName (projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName)
}

export function getValidPackageName (projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z\d\-~]+/g, '-')
}

export function setNamePackaging ({
  directory,
  packageName,
  root,
}: {
  directory: string
  packageName: string
  root: string
}) {
  const packagePath = path.join(directory, `package.json`)
  if (!fs.existsSync(packagePath)) return

  const packageFile = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  packageFile.name = packageName

  writeFile({file: 'package.json', content: JSON.stringify(packageFile, null, 2) + '\n', root, directory})
}

export function getPkgManager () {
  const userAgent = process.env.npm_config_user_agent

  if (!userAgent) return 'npm'

  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')

  return pkgSpecArr[0]
}

export function writeFromFolder ({
  directory,
  ignoreFiles = [],
  root,
}: {
  directory: string
  ignoreFiles: Array<string>
  root: string
}) {
  const filesRead = fs.readdirSync(directory)
  const files = filesRead.filter(f => !ignoreFiles.includes(f))

  for (const file of files) {
    writeFile({file, directory, root})
  }
}

export function writeFile ({
  file,
  content,
  root,
  directory,
}: {
  file: string
  content?: string
  root: string
  directory: string
}) {
  const targetPath = path.join(root, file)

  if (content) {
    fs.writeFileSync(targetPath, content)
  } else {
    copy(path.join(directory, file), targetPath)
  }

  if (file === "gitignore"){
    // fixes issue where npm removes gitignore file during publish https://github.com/npm/npm/issues/3763
    fs.renameSync(
      path.join(root, "gitignore"),
      path.join(root, ".gitignore")
    )
  }
}

function copy (source: string, target: string) {
  const stat = fs.statSync(source)

  if (stat.isDirectory()) {
    copyDirectory(source, target)
  } else {
    fs.copyFileSync(source, target)
  }
}

function copyDirectory (sourceDirectory: string, targetDirectory: string) {
  fs.mkdirSync(targetDirectory, {recursive: true})

  for (const file of fs.readdirSync(sourceDirectory)) {
    const srcFile = path.resolve(sourceDirectory, file)
    const destFile = path.resolve(targetDirectory, file)
    copy(srcFile, destFile)
  }
}
