import { HomeOutlined } from '@ant-design/icons'
import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

const PageNotFound = () => {
    const nagivate = useNavigate()

    return (
        <Result
            status='404'
            title={404}
            subTitle={'Không tìm thấy trang'}
            extra={
                <Button type='primary' onClick={() => nagivate('/category-management')} icon={<HomeOutlined />}>
                    Trang chủ
                </Button>
            }
        />
    )
}

export default PageNotFound
