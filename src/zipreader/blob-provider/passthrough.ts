import { BlobProvider } from "./interface"

export class PassthroughBlobProvider implements BlobProvider {
    constructor(private blob: Blob) {}

    get byteLength() {
        return this.blob.size
    }

    public slicedBlob(start: number, end: number): Promise<Blob> {
        return Promise.resolve(this.blob.slice(start, end))
    }

    public slicedData(start: number, end: number): Promise<Uint8Array> {
        return this.blob
            .slice(start, end)
            .arrayBuffer()
            .then(arrayBuffer => new Uint8Array(arrayBuffer))
    }
}
