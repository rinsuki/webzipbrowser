import React from "react"

import { TargetFile } from "./types"

import "./welcome.css"

export const Welcome: React.FC<{ setFile: (file: TargetFile) => void }> = props => {
    const [url, setUrl] = React.useState<string>("")
    const [disableRangeRequestForAvoidCORS, setDisableRangeRequestForAvoidCORS] =
        React.useState<boolean>(false)

    return (
        <div id="welcome-page">
            <div>
                <h1>webzipbrowser</h1>
                <p>you can browse .zip file & extract specified file with webzipbrowser.</p>
            </div>
            <form
                className="input-url"
                onSubmit={e => {
                    e.preventDefault()
                    props.setFile({ url, disableRangeRequestForAvoidCORS })
                }}
            >
                <fieldset>
                    <legend>Open ZIP File from URL</legend>
                    <input
                        type="text"
                        value={url}
                        onInput={e => setUrl(e.currentTarget.value)}
                        placeholder="Input ZIP File URL here (target server must be allow CORS)"
                    />
                    <label>
                        <input
                            type="checkbox"
                            checked={disableRangeRequestForAvoidCORS}
                            onChange={e =>
                                setDisableRangeRequestForAvoidCORS(e.currentTarget.checked)
                            }
                        />
                        Disable Range Request for Avoid CORS Issue
                    </label>
                    <input type="submit" value="Open" />
                </fieldset>
            </form>
            <div className="separator"> --- OR --- </div>
            <div className="drophere">
                <span>Drop file here or click to select file</span>
                <input
                    type="file"
                    onInput={e => {
                        const file = e.currentTarget.files?.item(0)
                        if (file != null) props.setFile(file)
                    }}
                />
            </div>
        </div>
    )
}
