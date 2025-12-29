import {
    BookOutlined,
    CloseOutlined,
    FileSearchOutlined,
    GithubOutlined,
    HomeOutlined,
    LinkOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    TeamOutlined,
    UserOutlined
} from '@ant-design/icons'
import { Avatar, Button, Drawer, Grid, Layout, Menu, Popconfirm, Tooltip } from 'antd'
import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoXrm from '../assets/svg/xrm.svg'
import { getFirstLetterName } from '../lib/utils'
import { clearToken } from '../lib/handleStorage'

const { Content, Sider, Header } = Layout

const getItem = (label, key, icon, children) => {
    return {
        key,
        icon,
        children,
        label
    }
}

const { useBreakpoint } = Grid

const BasicLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false)
    const [openDrawer, setOpenDrawer] = useState(false)
    const { xs } = useBreakpoint()
    const nagivate = useNavigate()
    const { pathname } = useLocation()

    const drawerMenu = [
        getItem(<p>Thông tin</p>, 'information', <UserOutlined />),
        getItem(<p>Mã nguồn</p>, 'source', <LinkOutlined />, [
            getItem(<a href='https://github.com/Tuienn/KMA-ONE'>Frontend Source</a>, 'frontend', <GithubOutlined />),
            getItem(<a href='https://github.com/Tuienn/KMA-ONE'>Backend Source</a>, 'backend', <GithubOutlined />)
        ]),
        getItem(
            <Popconfirm
                onConfirm={() => {
                    clearToken()
                    nagivate('/login')
                }}
                title='Đăng xuất'
                okText='Xác nhận'
                cancelText='Hủy'
                description='Bạn có chắc chắn muốn đăng xuất không?'
                placement='bottom'
            >
                <p className='text-red-500'>Đăng xuất</p>
            </Popconfirm>,
            'logout',
            <LogoutOutlined className='!text-red-500' />
        )
    ]

    const siderMenu = [
        getItem(<Link to='/'>Trang chủ</Link>, 'dashboard', <HomeOutlined />),
        getItem(<Link to='/student-management'>Quản lý sinh viên</Link>, 'student-management', <TeamOutlined />),
        getItem(<Link to='/course-management'>Quản lý khóa học</Link>, 'course-management', <BookOutlined />),
        getItem(<Link to='/score-management'>Quản lý môn học</Link>, 'score-management', <FileSearchOutlined />)
    ]
    return (
        <>
            <Layout className='overflow-hidden'>
                <Sider
                    collapsedWidth={collapsed ? (xs ? 0 : 50) : 200}
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                    className={`!max-w-none !bg-white sm:!max-w-[200px] ${!collapsed ? '!flex-0-0-100vw sm:!flex-0-0-50px' : '!flex-0-0-0px'}`}
                >
                    <div
                        className={`flex items-center gap-2 border-r !bg-white sm:justify-between ${collapsed ? '!justify-center' : 'px-[15px]'} py-[10px]`}
                    >
                        <div className='w-full'>
                            <img src={logoXrm} className='m-auto h-[44px]' />
                        </div>
                        <div className={`flex-auto text-end sm:hidden ${collapsed && 'hidden'}`}>
                            <CloseOutlined className='cursor-pointer text-[20px]' onClick={() => setCollapsed(true)} />
                        </div>
                    </div>
                    <Menu
                        defaultSelectedKeys={['1']}
                        mode='inline'
                        items={siderMenu}
                        selectedKeys={[...pathname.split('/')]}
                    />
                </Sider>
                <Layout className='h-screen'>
                    <Header className={`flex items-center justify-between !bg-white !px-4`}>
                        <div className='inline-block' onClick={() => setCollapsed(!collapsed)}>
                            {!collapsed ? (
                                <MenuFoldOutlined className='cursor-pointer text-2xl' />
                            ) : (
                                <MenuUnfoldOutlined className='cursor-pointer text-2xl' />
                            )}
                        </div>
                        <Tooltip title={'Admin1'} placement='left'>
                            <Avatar size={40} className={'cursor-pointer'} onClick={() => setOpenDrawer(true)}>
                                {getFirstLetterName('Admin1')}
                            </Avatar>
                        </Tooltip>
                        <Drawer
                            title={
                                <div className='flex items-center gap-2'>
                                    <Avatar size={40}>{getFirstLetterName('Admin1')}</Avatar>
                                    <h2>{'Admin1'}</h2>
                                </div>
                            }
                            open={openDrawer}
                            onClose={() => setOpenDrawer(false)}
                            closable={false}
                            width={300}
                        >
                            <Menu items={drawerMenu} selectedKeys={[pathname.split('/')[2]]} mode='inline' />
                        </Drawer>
                    </Header>
                    <Content className={`overflow-auto p-2 ${xs ? !collapsed && '' : ''}`}>
                        <main className='h-full w-full rounded-lg bg-white p-2'>{children}</main>
                    </Content>
                </Layout>
            </Layout>
        </>
    )
}

export default BasicLayout
