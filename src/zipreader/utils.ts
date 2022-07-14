export function parentDirName(dirName: string): string | null {
    if (dirName === "") return null
    if (dirName.endsWith("/")) return parentDirName(dirName.slice(0, -1))
    const lastSlash = dirName.lastIndexOf("/")
    if (lastSlash === -1) return ""
    return dirName.slice(0, lastSlash + 1)
}

export function fileName(path: string): string {
    const lastSlash = path.slice(0, -1).lastIndexOf("/")
    if (lastSlash === -1) return path
    return path.slice(lastSlash + 1)
}
