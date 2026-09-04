import fs from 'fs/promises'
import path from 'path'

import { Either, EitherAsync, pipe } from '@/lib/purify'

export const load = (
  filePath: string,
): EitherAsync<Error, string> => {
  return EitherAsync.tryCatch(async () => {
    const buff = await fs.readFile(filePath)
    return buff.toString()
  })
}

export const put = (
  filePath: string,
  content: string | NodeJS.ArrayBufferView,
): EitherAsync<Error, null> => {
  const dirPath = path.dirname(filePath)

  return EitherAsync
    .tryCatch(async () => {
      if (!fs.access(dirPath)) {
        await fs.mkdir(dirPath, { recursive: true })
      }
      return filePath
    })
    .mapLeft(() => new Error(
      `file: "${path.dirname(filePath)}" dir is not found and could not been created`
    ))
    .chain(filePath =>
      EitherAsync
        .tryCatch(
          () => fs.writeFile(filePath!, content)
        )
        .mapLeft(() => new Error(
          `file: "${filePath}" could not been created`
        ))
        .map(() => null)
    )
}

export const copy = async (
  source: string,
  destination: string
) => {
  const stats = await fs.stat(source)
  if (stats.isDirectory()) {
    const targetDestination = path.join(destination, path.basename(source))
    fs.mkdir(targetDestination, { recursive: true })
    const items = await fs.readdir(source)
    await Promise.all(
      items.map(item =>
        copy(
          path.join(source, item),
          path.join(targetDestination, item)
        )
      )
    )
  } else {
    fs.copyFile(source, destination)
  }
}

export const exists = async (
  targetPath: string
) => {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

export const setupDir = async (
  dirPath: string
) => {
  const dirExists = await exists(dirPath)
  dirExists && await fs.mkdir(dirPath, { recursive: true })
}

export const isDirectory = async (path: string): Promise<boolean> => {
  try {
    const stats = await fs.stat(path);
    return stats.isDirectory();
  } catch (error) {
    return false; // Path doesn't exist or error
  }
}

// Takes the filename from sourcePath and places it in the directory from targetPath
// Changes the BASE (directory) of the file
export const rebasePath = (
  sourcePath: string,
  targetDir: string
) => {
  return path.join(
    targetDir,
    path.basename(sourcePath)
  )
}

export const removeLastExtension = (
  target: string,
  ext: string
) => {
  return target.endsWith(ext)
    ? target.slice(0, -ext.length) 
    : target
}