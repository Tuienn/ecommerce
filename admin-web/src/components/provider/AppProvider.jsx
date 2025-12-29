// components/provider/noti-provider.tsx
import { App } from 'antd'
import { createContext, useContext } from 'react'

const AppContext = createContext({
    showMessage: () => {},
    showNotification: () => {}
})

const AppContextProvider = ({ children }) => {
    const { message, notification } = App.useApp()

    const showNotification = (type, text) => {
        notification[type]({
            message: 'Thông báo',
            description: text
        })
    }

    const showMessage = (type, text) => {
        message[type](text)
    }

    return (
        <AppContext.Provider
            value={{
                showMessage,
                showNotification
            }}
        >
            {children}
        </AppContext.Provider>
    )
}

const AppProvider = ({ children }) => {
    return <AppContextProvider>{children}</AppContextProvider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
    return useContext(AppContext)
}

export default AppProvider
