import React, { StrictMode, Suspense, useState } from "react"
import { createRoot } from "react-dom/client"

import { App } from "./app"

import "./style.css"
import { TargetFile } from "./types"
import { Welcome } from "./welcome"

const Root: React.FC = () => {
    const [file, setFile] = useState<TargetFile>()

    if (file == null) {
        if (location.search != "") {
            const params = new URLSearchParams(location.search)
            const url = params.get("url")
            const disableRangeRequestForAvoidCORS =
                params.get("disableRangeRequestForAvoidCORS") == "true"
            if (url != null) {
                setFile({ url, disableRangeRequestForAvoidCORS })
            }
        }
        return <Welcome setFile={setFile} />
    }

    return (
        <Suspense fallback={<p>Loading .zip file...</p>}>
            <App file={file} reset={() => setFile(undefined)} />
        </Suspense>
    )
}

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <Root />
    </StrictMode>,
)
