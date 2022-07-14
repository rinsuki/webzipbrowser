import { BlobProvider } from "./interface"

export class HTTPBlobProvider implements BlobProvider {
    private constructor(
        private url: string,
        public readonly byteLength: number,
        private etag: string | undefined,
    ) {}

    static async init(url: string, checkETag = true) {
        const headRes = await fetch(url, { method: "HEAD" })
        if (!headRes.ok) throw new Error(`HTTP Fail: ${headRes.status} ${headRes.statusText}`)
        const byteLength = parseInt(headRes.headers.get("Content-Length") ?? "0", 10)
        return new HTTPBlobProvider(url, byteLength, headRes.headers.get("etag") ?? undefined)
    }

    private generateHeader(start: number, end: number) {
        const headers: Record<string, string> = {
            Range: `bytes=${start}-${end - 1}`,
        }

        if (this.etag != null) headers["If-Match"] = this.etag
        return headers
    }

    public async slicedBlob(start: number, end: number): Promise<Blob> {
        const res = await fetch(this.url, {
            headers: this.generateHeader(start, end),
        })
        if (!res.ok) throw new Error(`HTTP Fail: ${res.status} ${res.statusText}`)
        return res.blob()
    }

    public async slicedData(start: number, end: number): Promise<Uint8Array> {
        const res = await fetch(this.url, {
            headers: this.generateHeader(start, end),
        })
        if (!res.ok) throw new Error(`HTTP Fail: ${res.status} ${res.statusText}`)
        const arrayBuffer = await res.arrayBuffer()
        return new Uint8Array(arrayBuffer)
    }
}
