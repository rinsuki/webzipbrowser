/* eslint-disable @typescript-eslint/no-var-requires */
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

module.exports = {
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    entry: "./src/index.tsx",
    output: {
        path: __dirname + "/public/assets/",
        filename: "[name].js",
        publicPath: "/assets/",
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" },
            { test: /\.css$/, use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"] },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [new MiniCssExtractPlugin()],
}
