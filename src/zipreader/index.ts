import { SyncReader } from "binarin"
import { inflateRaw } from "pako"

import { BlobProvider } from "./blob-provider/interface"
import { ZipFileEntry } from "./entry"
import { mimeFromFileName } from "./mime"
import { fileName, parentDirName } from "./utils"

export class ZipReader {
    static readonly ERR_INVALID_MAGIC = "invalid zip magic"
    static readonly ERR_EOCDR_NOT_EXISTS = "End of central directory record not exists"
    static readonly ERR_MULTIDISK_ZIP = "multi-disk zip is not supported"
    static readonly ERR_ZIP64_SOON = "ZIP64 is currently not supported"
    static readonly ERR_NOT_CENTRAL_DIRECTORY_RECORD = "not central directory record"
    static readonly ERR_TOO_HIGH_VERSION = (version: number) =>
        `zip file version is too high (${version})`

    static readonly ERR_UNSUPPORTED_COMPRESSION_METHOD = (method: number) =>
        `unsupported compression method (${method})`

    private constructor(
        private blobProvider: BlobProvider,
        public files: { fileName: string | Uint8Array }[],
        public directories: Map<string, Map<string, ZipFileEntry | { directory: string }>>,
    ) {
        console.log(this)
    }

    static async init(blobProvider: BlobProvider, fallbackCharset = "shift-jis") {
        // Find Central Dir Signature
        const EOCDR_LENGTH = 4 + 2 + 2 + 2 + 2 + 4 + 4 + 2
        const blobLastPart = await blobProvider.slicedData(
            Math.max(0, blobProvider.byteLength - (65535 + EOCDR_LENGTH)),
            blobProvider.byteLength,
        )
        let index = blobLastPart.byteLength - 1
        let found = false
        while (index > EOCDR_LENGTH) {
            index--
            // const expectedCommentLength = blobLastPart.byteLength - index - 2
            // console.log(expectedCommentLength)
            // console.log(blobLastPart[index], blobLastPart[index + 1])
            // if (blobLastPart[index] !== (expectedCommentLength & 0xff)) continue
            // if (blobLastPart[index + 1] !== expectedCommentLength >> 8) continue
            if (blobLastPart[index - EOCDR_LENGTH + 2] !== 0x50) continue
            if (blobLastPart[index - EOCDR_LENGTH + 3] !== 0x4b) continue
            if (blobLastPart[index - EOCDR_LENGTH + 4] !== 0x05) continue
            if (blobLastPart[index - EOCDR_LENGTH + 5] !== 0x06) continue
            found = true
            break
        }
        if (!found) throw new Error(this.ERR_EOCDR_NOT_EXISTS)
        const eocdrIndex = index - EOCDR_LENGTH + 2
        console.log(eocdrIndex)
        const eocdr = this.parseEOCDR(blobLastPart.slice(eocdrIndex))
        console.log(eocdr)

        const centralDirChunk = await blobProvider.slicedData(
            eocdr.centralDirOffset,
            eocdr.centralDirOffset + eocdr.centralDirSize,
        )
        const reader = new SyncReader(new Uint8Array(centralDirChunk), 0, true)
        const files = []
        const directories: typeof ZipReader["prototype"]["directories"] = new Map()
        while (reader.pointer < reader.dataView.byteLength) {
            const file = new ZipFileEntry(reader, fallbackCharset)
            files.push(file)
            let dir = directories.get(file.dirName)
            if (dir == null) {
                dir = new Map()
                directories.set(file.dirName, dir)
                // parent dir がない可能性もあるので作っておく
                let dirName = file.dirName
                let parentDir = parentDirName(dirName)
                while (parentDir != null) {
                    let parentDirMap = directories.get(parentDir)
                    if (parentDirMap == null) {
                        parentDirMap = new Map()
                        directories.set(parentDir, parentDirMap)
                    }
                    if (!parentDirMap.has(fileName(dirName))) {
                        console.log("virtualdir", parentDir, fileName(dirName))
                        parentDirMap.set(fileName(dirName), { directory: fileName(dirName) })
                    }
                    dirName = parentDir
                    parentDir = parentDirName(dirName)
                }
            }
            console.log(file.dirName, file.fileName, file)
            dir.set(file.fileName, file)
        }

        console.log(files)

        // alert(1)

        return new ZipReader(blobProvider, files, directories)
    }

    static parseEOCDR(bytes: Uint8Array) {
        const reader = new SyncReader(bytes, 0, true)
        const magic = reader.u32()
        if (magic !== 0x06054b50) throw new Error(this.ERR_INVALID_MAGIC)
        const diskNumber = reader.u16()
        if (diskNumber !== 0) throw new Error(this.ERR_MULTIDISK_ZIP)
        const diskNumberWithStartOfCentralDir = reader.u16()
        if (diskNumberWithStartOfCentralDir !== 0) throw new Error(this.ERR_MULTIDISK_ZIP)
        const centralDirectoryCountOnDisk = reader.u16()
        const centralDirectoryCount = reader.u16()
        console.log(centralDirectoryCount, centralDirectoryCountOnDisk)
        if (centralDirectoryCountOnDisk !== centralDirectoryCount)
            throw new Error(this.ERR_MULTIDISK_ZIP)
        const centralDirSize = reader.u32()
        const centralDirOffset = reader.u32()
        // const commentLength = reader.u16()
        if (centralDirOffset === 0xffffffff) throw new Error(this.ERR_ZIP64_SOON)
        return {
            centralDirSize,
            centralDirOffset,
        }
    }

    async extract(entry: ZipFileEntry) {
        if (entry.uncompressedSize === 0) return new File([], entry.fileName)
        const fileHeader = await this.blobProvider.slicedData(
            entry.relativeOffsetOfLocalHeader,
            entry.relativeOffsetOfLocalHeader + 30,
        )
        const reader = new SyncReader(new Uint8Array(fileHeader), 0, true)
        console.log(new Uint8Array(fileHeader))
        const magic = reader.u32()
        if (magic !== 0x04034b50) throw new Error(ZipReader.ERR_INVALID_MAGIC)
        const version = reader.u8()
        if (version > 20) throw new Error(ZipReader.ERR_TOO_HIGH_VERSION(version))
        const host = reader.u8()
        const generalPurposeFlag = reader.u16()
        const compressionMethod = reader.u16()
        const lastModifiedTime = reader.u16()
        const lastModifiedDate = reader.u16()
        const crc32 = reader.u32()
        let compressedSize = reader.u32()
        if (compressedSize === 0) {
            compressedSize = entry.compressedSize
        } else if (compressedSize !== entry.compressedSize) {
            throw new Error("invalid compressed size")
        }
        const uncompressedSize = reader.u32()
        const fileNameLength = reader.u16()
        const extraFieldLength = reader.u16()
        const compressedDataStart =
            entry.relativeOffsetOfLocalHeader + 30 + fileNameLength + extraFieldLength
        console.table({
            magic,
            version,
            host,
            generalPurposeFlag,
            compressionMethod,
            lastModifiedTime,
            lastModifiedDate,
            crc32,
            compressedSize,
            uncompressedSize,
            fileNameLength,
            extraFieldLength,
        })
        console.log(entry, fileNameLength, extraFieldLength, compressedDataStart, compressedSize)
        const compressedData = await this.blobProvider.slicedBlob(
            compressedDataStart,
            compressedDataStart + compressedSize,
        )
        console.log(compressedDataStart, compressedDataStart + compressedSize, compressedData)

        if (compressionMethod === 0) {
            return new File([compressedData], entry.fileName, {
                type: mimeFromFileName(entry.fileName),
                lastModified: entry.lastModified.getTime(),
            })
        } else if (compressionMethod === 8) {
            const compressedArrayBuffer = await compressedData.arrayBuffer()
            const result = inflateRaw(compressedArrayBuffer)
            console.log(result)
            return new File([result], entry.fileName, {
                type: mimeFromFileName(entry.fileName),
                lastModified: entry.lastModified.getTime(),
            })
        } else {
            throw new Error(ZipReader.ERR_UNSUPPORTED_COMPRESSION_METHOD(compressionMethod))
        }
    }
}
