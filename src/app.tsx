import React, { useState } from "react"

import "./app.css"
import { TargetFile } from "./types"
import { ZipReader } from "./zipreader"
import { HTTPBlobProvider } from "./zipreader/blob-provider/http"
import { BlobProvider } from "./zipreader/blob-provider/interface"
import { PassthroughBlobProvider } from "./zipreader/blob-provider/passthrough"

const zipData = new WeakMap<File | { url: string }, ZipReader | Promise<unknown>>()

export const DirDetails: React.FC<{
    zipFile: ZipReader
    dirName: string
    name: string
    virtual: boolean
}> = props => {
    const [opened, setOpened] = useState(false)
    return (
        <li className={`folder folder-opened-${opened.toString()}`}>
            <details open={opened} onToggle={e => setOpened(e.currentTarget.open)}>
                <summary>
                    {props.name}
                    {props.virtual && " (virtual)"}
                </summary>
                <Dir zipFile={props.zipFile} dirName={props.dirName} />
            </details>
        </li>
    )
}

export const Dir: React.FC<{ zipFile: ZipReader; dirName: string }> = ({ zipFile, dirName }) => {
    const dir = zipFile.directories.get(dirName)
    if (dir == null) return null

    const dirEntries = Array.from(dir.entries())
    let maxNumberLength = 0
    for (const [name] of dirEntries) {
        let cnt = 0
        for (let i = 0; i < name.length; i++) {
            const cc = name.charCodeAt(i)
            if (cc >= 48 && cc <= 57) {
                cnt++
                if (maxNumberLength < cnt) maxNumberLength = cnt
            } else {
                cnt = 0
            }
        }
    }

    return (
        <ul className="filelist">
            {...dirEntries
                .sort(([a], [b]) => {
                    if (a === b) return 0
                    const ra = a.replace(/[0-9]+/g, c => c.padStart(maxNumberLength, "0"))
                    const rb = b.replace(/[0-9]+/g, c => c.padStart(maxNumberLength, "0"))
                    return ra > rb ? 1 : -1
                })
                .map(([, file]) => {
                    if (!("directory" in file) && !file.fileName.endsWith("/")) {
                        return (
                            <li key={file.fileName}>
                                <a
                                    href="javascript://"
                                    onClick={e => {
                                        e.preventDefault()
                                        ;(async () => {
                                            const blob = await zipFile.extract(file)
                                            if (blob == null) return alert("???")
                                            const url = URL.createObjectURL(blob)
                                            const a = document.createElement("a")
                                            a.href = url
                                            a.target = "_blank"
                                            // a.download = file.fileName
                                            a.click()
                                            // URL.revokeObjectURL(url)
                                        })().catch(e => {
                                            console.error(e)
                                            alert(e)
                                        })
                                    }}
                                >
                                    {file.fileName}
                                </a>{" "}
                                (
                                <span
                                    style={{
                                        color:
                                            file.compressedSize > file.uncompressedSize
                                                ? "red"
                                                : undefined,
                                    }}
                                >
                                    {file.compressedSize} → {file.uncompressedSize} bytes
                                </span>
                                , compression method: {file.compressionMethod})
                            </li>
                        )
                    } else {
                        const dn = "directory" in file ? file.directory : file.fileName
                        return (
                            <DirDetails
                                zipFile={zipFile}
                                dirName={dirName + dn}
                                name={dn}
                                virtual={"directory" in file}
                            />
                        )
                    }
                })}
        </ul>
    )
}

export const App: React.FC<{ file: TargetFile; reset: () => void }> = ({ file, reset }) => {
    const data = zipData.get(file)
    if (data == null) {
        const promise = Promise.resolve<BlobProvider>(
            file instanceof Blob
                ? new PassthroughBlobProvider(file)
                : file.disableRangeRequestForAvoidCORS
                ? fetch(file.url)
                      .then(r => r.blob())
                      .then(r => new PassthroughBlobProvider(r))
                : HTTPBlobProvider.init(file.url),
        )
            .then(provider => ZipReader.init(provider))
            .then(zr => {
                zipData.set(file, zr)
            })
            .catch(e => {
                console.error(e)
                alert(e)
                reset()
            })
        zipData.set(file, promise)
        throw promise
    }
    if ("then" in data) throw data
    return (
        <div>
            {file instanceof Blob ? file.name : file.url}:
            <Dir zipFile={data} dirName="" />
        </div>
    )
}
