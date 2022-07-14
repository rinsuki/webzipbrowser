export const ext2mime: Record<string, string> = {
    // images
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    ico: "image/x-icon",
    svg: "image/svg+xml",
    webp: "image/webp",
    tif: "image/tiff",
    tiff: "image/tiff",

    // audio files
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",

    // video files
    mp4: "video/mp4",
    webm: "video/webm",
    ogv: "video/ogg",
    mkv: "video/x-matroska",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mpg: "video/mpeg",
    m2ts: "video/mp2t",
    ts: "video/mp2t",

    // text files
    txt: "text/plain",
    csv: "text/csv",
    html: "text/plain",
    htm: "text/plain",
    xhtml: "text/plain",
    xml: "text/xml",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    md: "text/plain",

    // other types
    zip: "application/zip",
    pdf: "application/pdf",
}

export function mimeFromFileName(fileName: string): string | undefined {
    const extension = fileName.slice(fileName.lastIndexOf(".") + 1)
    return ext2mime[extension]
}
