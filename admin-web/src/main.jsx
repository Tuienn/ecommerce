import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/styles/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from 'antd'
import Routes from './routes/Routes.jsx'
import AntdConfigProvider from './components/provider/AntdConfigProvider.jsx'
import '@ant-design/v5-patch-for-react-19'
import AppProvider from './components/provider/AppProvider.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AntdConfigProvider>
                <App>
                    <AppProvider>
                        <Routes />
                    </AppProvider>
                </App>
            </AntdConfigProvider>
        </QueryClientProvider>
    </StrictMode>
)
