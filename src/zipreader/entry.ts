import { SyncReader } from "binarin"

import { ZipReader } from "."

function tryDecode(bytes: Uint8Array, charsets: string[]): string {
    try {
        const decoder = new TextDecoder(charsets[0], { fatal: true })
        return decoder.decode(bytes)
    } catch (e) {
        if (charsets.length > 1) {
            return tryDecode(bytes, charsets.slice(1))
        } else {
            throw e
        }
    }
}

export class ZipFileEntry {
    public madeVersion: number
    public madeHost: number
    public extractVersion: number
    public extractHost: number
    public generalPurposeBitFlag: number
    public compressionMethod: number
    public lastModified: Date
    public crc32: number
    public compressedSize: number
    public uncompressedSize: number
    public path: string
    public dirName: string
    public fileName: string
    public extraField: Uint8Array
    public fileComment: Uint8Array
    public diskNumberStart: number
    public internalFileAttributes: number
    public externalFileAttributes: number
    public relativeOffsetOfLocalHeader: number

    constructor(reader: SyncReader, fallbackCharset: string) {
        const magic = reader.u32()
        if (magic !== 0x02014b50) {
            console.log(magic.toString(16))
            throw new Error(ZipReader.ERR_NOT_CENTRAL_DIRECTORY_RECORD)
        }
        this.madeVersion = reader.u8()
        this.madeHost = reader.u8()
        this.extractVersion = reader.u8()
        this.extractHost = reader.u8()
        if (this.extractVersion > 21) {
            throw new Error(ZipReader.ERR_TOO_HIGH_VERSION(this.extractVersion))
        }
        this.generalPurposeBitFlag = reader.u16()
        this.compressionMethod = reader.u16()
        const lastModifiedTime = reader.u16()
        const lastModifiedDate = reader.u16()
        this.lastModified = new Date(
            1980 + (lastModifiedDate >> 9),
            (lastModifiedDate >> 5) & 0xf,
            lastModifiedDate & 0x1f,
            lastModifiedTime >> 11,
            (lastModifiedTime >> 5) & 0x3f,
            (lastModifiedTime & 0x1f) * 2,
        )
        this.crc32 = reader.u32()
        this.compressedSize = reader.u32()
        this.uncompressedSize = reader.u32()
        const fileNameLength = reader.u16()
        const extraFieldLength = reader.u16()
        const fileCommentLength = reader.u16()
        this.diskNumberStart = reader.u16()
        this.internalFileAttributes = reader.u16()
        this.externalFileAttributes = reader.u32()
        this.relativeOffsetOfLocalHeader = reader.u32()
        const fileName = reader.bytesNoCopy(fileNameLength)
        const utf8Mode = !!(this.generalPurposeBitFlag & (1 << 11))
        this.path = tryDecode(
            fileName,
            utf8Mode
                ? ["utf-8"]
                : [
                      fallbackCharset,
                      "utf-8" /* stub: we need to determine charset with some magic */,
                  ],
        )
        if (this.path.endsWith("//")) {
            console.warn("double slash", this.path)
            this.path = this.path.replace(/\/+$/, "/")
        }
        const lastSlash =
            (this.path.endsWith("/")
                ? this.path.slice(0, -1).lastIndexOf("/")
                : this.path.lastIndexOf("/")) + 1
        this.dirName = this.path.slice(0, lastSlash)
        this.fileName = this.path.slice(lastSlash)
        this.extraField = reader.bytesNoCopy(extraFieldLength)
        this.fileComment = reader.bytesNoCopy(fileCommentLength)
    }
}
