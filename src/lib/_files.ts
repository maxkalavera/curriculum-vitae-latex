import fs from 'fs/promises'
import path from 'path'

export const load = (
  filePath: string,
): TaskEither<Error, string> => {
 return TaskEither.tryCatch(
    () => (
      fs.readFile(filePath)
      .then(res => res.toString())
    ),
    (reason) => new Error(String(reason))
  )
}

export const loadMany = (
  ...filePaths: string[]
): TaskEither<Error, readonly string[]> => {
  return TaskEither.sequenceArray(
    filePaths.map(filePath => load(filePath))
  )
}

export const put = (
  filePath: string,
  content: string | NodeJS.ArrayBufferView,
) => {
  const dirPath = path.dirname(filePath)
  return pipe(
    TaskEither.tryCatch(
      () => {
        if (!fs.access(dirPath)) {
          return fs.mkdir(dirPath, { recursive: true })
        }
        return Promise.resolve(filePath)
      },
      reason => new Error(
        `file: ${filePath} dir is not found and could not been created.\n ${String(reason)}`
      )
    ),
    TaskEither.flatMap(filePath => 
      TaskEither.tryCatch(
        () => fs.writeFile(filePath!, content),
        reason => new Error(String(reason))
      )
    )
  )
}

export const putMany = (
  files: {
    filePath: string;
    content: string | NodeJS.ArrayBufferView;
  }[],
) => {
  return pipe(
    TaskEither.sequenceArray(
      files.map(({ filePath, content }) => put(filePath, content))
    ),
    TaskEither.map(() => {})
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

export const copyMany = async (
  sources: string[],
  destination: string
) => {
  await Promise.all(
    sources.map(source => copy(source, destination))
  )
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