import { ConfigProvider } from 'antd'

const customTheme = {
    token: {
        screenXS: 376,
        screenXSMax: 639,
        screenXSMin: 376,

        screenSMMax: 767,
        screenSMMin: 640,
        screenSM: 640,

        screenMDMax: 1023,
        screenMDMin: 768,
        screenMD: 768,

        screenLGMax: 1279,
        screenLGMin: 1024,
        screenLG: 1024,

        screenXLMax: 1535,
        screenXLMin: 1280,
        screenXL: 1280,

        screenXXL: 1536,
        screenXXLMin: 1536
    },
    components: {}
}

const AntdConfigProvider = ({ children }) => {
    return <ConfigProvider theme={customTheme}>{children}</ConfigProvider>
}

export default AntdConfigProvider
