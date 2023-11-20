import {join, relative} from 'node:path'

import prompts from 'prompts'

import {DEFAULT_FOLDER} from './const.js'
import {TEMPLATES, getPathTemplate} from './TEMPLATES.js'
import {
  args,
  catchify,
  folderDirectory,
  getPkgManager,
  getProjectName,
  getTemplateDirectory,
  getValidPackageName,
  isEmptyDirectory,
  isValidPackageName,
  setNamePackaging,
  targetDirectory,
  writeFromFolder,
} from './utils.js'

console.clear()

const argv = args()
const cwd = process.cwd()
const pkg = getPkgManager()

async function init () {
  const results = await resultPrompts()
  const name = results['project-name']

  const path = getPathTemplate(results)
  const directory = getTemplateDirectory(path)

  const root = join(cwd, name)
  folderDirectory(root, results.overwrite)

  writeFromFolder({directory, root, ignoreFiles: ['package.json']})

  const packageName = results['package-name'] || getProjectName(name)
  setNamePackaging({directory, root, packageName})

  const projectName = relative(cwd, root)

  console.log(`\nFinalizado!\n`)

  if (root !== cwd) {
    const name = projectName.includes(' ') ? `"${projectName}"` : projectName
    console.log(`  cd ${name}`)
  }

  console.log(`  ${pkg} install`)
  console.log(`  ${pkg} run dev\n`)
}

async function resultPrompts () {
  let [TargetDirectory, isDefaultDirectory] = targetDirectory(argv._[0])

  if (!isDefaultDirectory) {
    const projectName = getProjectName(TargetDirectory)
    console.log(`  Se creará proyecto en -> ${projectName}`)
  }

  const prompt = prompts(
    [
      {
        type: isDefaultDirectory ? 'text' : null,
        name: 'project-name',
        message: 'Nombre del proyecto',
        initial: DEFAULT_FOLDER,
        onState: ({value}) => ([TargetDirectory, isDefaultDirectory] = targetDirectory(value)),
      },
      {
        type: () => (isEmptyDirectory(TargetDirectory) ? null : 'toggle'),
        name: 'overwrite',
        message: 'La carpeta de destino no está vacía, ¿Desea sobrescribir?',
        initial: false,
        active: 'Sí',
        inactive: 'No',
      },
      {
        type: (_, {overwrite}) => {
          if (overwrite === false) throw new Error('Se cancela ejecución!')
          return null
        },
        name: 'overwrite-check',
      },
      {
        type: () => (isValidPackageName(getProjectName(TargetDirectory)) ? null : 'text'),
        name: 'package-name',
        message: 'Nombre del paquete (usado en package.json)',
        initial: () => getValidPackageName(getProjectName(TargetDirectory)),
        validate: name => isValidPackageName(name) || 'Nombre no permitido en package.json',
      },
      {
        type: 'select',
        name: 'framework',
        message: '¿Que entorno de ejecución?',
        initial: 0,
        choices: TEMPLATES,
      },
      {
        type: prev => {
          const getFramework = TEMPLATES.find((t: {value: string}) => t.value === prev)
          return getFramework && getFramework.variant ? 'select' : null
        },
        name: 'variant',
        message: '¿Que librería/framework de frontend?',
        initial: 0,
        choices: prev => {
          const getFramework = TEMPLATES.find((t: {value: string}) => t.value === prev)
          return (getFramework && getFramework.variant) || []
        },
      },
      {
        type: (_, {framework, variant}) => {
          const getFramework = TEMPLATES.find((t: {value: string}) => t.value === framework)
          if (!getFramework) return null

          if (getFramework.variant) {
            const getVariant = getFramework.variant.find(v => v.value === variant)
            return getVariant && getVariant.design ? 'select' : null
          }

          return getFramework.design ? 'select' : null
        },
        name: 'design',
        message: '¿Que librería de diseño?',
        initial: 0,
        choices: (_, {framework, variant}) => {
          const getFramework = TEMPLATES.find((t: {value: string}) => t.value === framework)
          if (!getFramework) return []

          if (getFramework.variant) {
            const getVariant = getFramework.variant.find(v => v.value === variant)
            return (getVariant && getVariant.design) || []
          }

          return getFramework.design || []
        },
      },
    ],
    {
      onCancel: () => {
        throw new Error('creación cancelada')
      },
    },
  )

  const [error, results] = await catchify(prompt)
  if (error) throw new Error(error?.message || 'Se ha presentado un error, intente nuevamente')

  results['project-name'] ||= TargetDirectory
  return results
}

init().catch(e => console.log(e.message))
