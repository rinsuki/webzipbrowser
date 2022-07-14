export interface BlobProvider {
    byteLength: number
    slicedBlob(start: number, end: number): Promise<Blob>
    slicedData(start: number, end: number): Promise<Uint8Array>
}
