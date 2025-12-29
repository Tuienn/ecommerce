import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Modal, Select, Space, Tag, Typography, Card, Tooltip, Descriptions, Divider, Input } from 'antd'
import {
    ReloadOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    CarOutlined,
    ShoppingOutlined,
    DollarOutlined
} from '@ant-design/icons'
import OrderService from '../../services/order.service'
import { useApp } from '../../components/provider/AppProvider'

const { Title, Text } = Typography

// Order status options
const ORDER_STATUS_OPTIONS = [
    { value: 'PROCESSING', label: 'Đang xử lý', color: 'processing', icon: <SyncOutlined spin /> },
    { value: 'PAID', label: 'Đã thanh toán', color: 'blue', icon: <DollarOutlined /> },
    { value: 'SHIPPING', label: 'Đang giao', color: 'orange', icon: <CarOutlined /> },
    { value: 'COMPLETED', label: 'Hoàn thành', color: 'success', icon: <CheckCircleOutlined /> },
    { value: 'FAILED', label: 'Thất bại', color: 'error', icon: <CloseCircleOutlined /> },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'default', icon: <CloseCircleOutlined /> }
]

// Payment status options
const PAYMENT_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Chờ thanh toán', color: 'warning' },
    { value: 'SUCCESS', label: 'Thành công', color: 'success' },
    { value: 'FAILED', label: 'Thất bại', color: 'error' }
]

const OrderManagement = () => {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [newStatus, setNewStatus] = useState(null)
    const [newPaymentStatus, setNewPaymentStatus] = useState(null)
    const [transactionId, setTransactionId] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [filterStatus, setFilterStatus] = useState(null)
    const queryClient = useQueryClient()
    const { showNotification } = useApp()

    // Query danh sách đơn hàng
    const {
        data: ordersData,
        isLoading,
        refetch
    } = useQuery({
        queryKey: ['orders', currentPage, pageSize, filterStatus],
        queryFn: () =>
            OrderService.getAllOrders({
                page: currentPage,
                limit: pageSize,
                ...(filterStatus && { status: filterStatus })
            })
    })

    const orders = ordersData?.data?.data || []
    const pagination = ordersData?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

    // Mutation cập nhật trạng thái đơn hàng
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => OrderService.updateOrderStatus(id, status),
        onSuccess: () => {
            showNotification('success', 'Cập nhật trạng thái đơn hàng thành công')
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            setIsStatusModalOpen(false)
            setSelectedOrder(null)
            setNewStatus(null)
        },
        onError: (error) => {
            showNotification('error', error.message || 'Cập nhật trạng thái thất bại')
        }
    })

    // Mutation cập nhật trạng thái thanh toán
    const verifyPaymentMutation = useMutation({
        mutationFn: ({ id, paymentStatus, transactionId }) =>
            OrderService.verifyBankStatus(id, paymentStatus, transactionId),
        onSuccess: () => {
            showNotification('success', 'Cập nhật trạng thái thanh toán thành công')
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            setIsPaymentModalOpen(false)
            setSelectedOrder(null)
            setNewPaymentStatus(null)
            setTransactionId('')
        },
        onError: (error) => {
            showNotification('error', error.message || 'Cập nhật thanh toán thất bại')
        }
    })

    // Mở modal chi tiết
    const handleViewDetail = (record) => {
        setSelectedOrder(record)
        setIsDetailModalOpen(true)
    }

    // Mở modal cập nhật trạng thái
    const handleOpenStatusModal = (record) => {
        setSelectedOrder(record)
        setNewStatus(record.status)
        setIsStatusModalOpen(true)
    }

    // Mở modal cập nhật thanh toán
    const handleOpenPaymentModal = (record) => {
        setSelectedOrder(record)
        setNewPaymentStatus(record.payment?.status)
        setTransactionId(record.payment?.transactionId || '')
        setIsPaymentModalOpen(true)
    }

    // Submit cập nhật trạng thái
    const handleUpdateStatus = () => {
        if (selectedOrder && newStatus) {
            updateStatusMutation.mutate({
                id: selectedOrder._id,
                status: newStatus
            })
        }
    }

    // Submit cập nhật thanh toán
    const handleVerifyPayment = () => {
        if (selectedOrder && newPaymentStatus) {
            verifyPaymentMutation.mutate({
                id: selectedOrder._id,
                paymentStatus: newPaymentStatus,
                transactionId: transactionId || undefined
            })
        }
    }

    // Format tiền VND
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price)
    }

    // Get status tag
    const getStatusTag = (status) => {
        const option = ORDER_STATUS_OPTIONS.find((opt) => opt.value === status)
        return (
            <Tag color={option?.color} icon={option?.icon}>
                {option?.label || status}
            </Tag>
        )
    }

    // Get payment status tag
    const getPaymentStatusTag = (status) => {
        const option = PAYMENT_STATUS_OPTIONS.find((opt) => opt.value === status)
        return <Tag color={option?.color}>{option?.label || status}</Tag>
    }

    // Cấu hình columns cho Table
    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: '_id',
            key: '_id',
            width: 100,
            render: (id) => <Text copyable={{ text: id }}>{id.slice(-8).toUpperCase()}</Text>
        },
        {
            title: 'Khách hàng',
            dataIndex: 'userId',
            key: 'userId',
            width: 180,
            render: (user) => (
                <div>
                    <div className='font-medium'>{user?.name || 'N/A'}</div>
                    <div className='text-xs text-gray-500'>{user?.email}</div>
                </div>
            )
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'total',
            key: 'total',
            width: 130,
            align: 'right',
            render: (total) => <span className='font-semibold text-green-600'>{formatPrice(total)}</span>
        },
        {
            title: 'Thanh toán',
            dataIndex: 'payment',
            key: 'payment',
            width: 150,
            align: 'center',
            render: (payment) => (
                <div>
                    <div>{payment?.provider}</div>
                    {getPaymentStatusTag(payment?.status)}
                </div>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            align: 'center',
            render: (status) => getStatusTag(status)
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) =>
                new Date(date).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 150,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space size='small'>
                    <Tooltip title='Xem chi tiết'>
                        <Button type='text' icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
                    </Tooltip>
                    <Tooltip title='Cập nhật trạng thái'>
                        <Button type='text' icon={<ShoppingOutlined />} onClick={() => handleOpenStatusModal(record)} />
                    </Tooltip>
                    <Tooltip title='Xác nhận thanh toán'>
                        <Button
                            type='text'
                            icon={<DollarOutlined />}
                            onClick={() => handleOpenPaymentModal(record)}
                            disabled={record.payment?.status === 'SUCCESS'}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ]

    return (
        <div className='p-4'>
            <Card>
                <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                    <Title level={4} className='!mb-0'>
                        Quản lý đơn hàng
                    </Title>
                    <Space wrap>
                        <Select
                            placeholder='Lọc theo trạng thái'
                            allowClear
                            style={{ width: 180 }}
                            value={filterStatus}
                            onChange={(value) => {
                                setFilterStatus(value)
                                setCurrentPage(1)
                            }}
                        >
                            {ORDER_STATUS_OPTIONS.map((opt) => (
                                <Select.Option key={opt.value} value={opt.value}>
                                    <Tag color={opt.color}>{opt.label}</Tag>
                                </Select.Option>
                            ))}
                        </Select>
                        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                            Làm mới
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={orders}
                    rowKey='_id'
                    loading={isLoading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng`,
                        onChange: (page, size) => {
                            setCurrentPage(page)
                            setPageSize(size)
                        }
                    }}
                    bordered
                    size='middle'
                    scroll={{ x: 1100 }}
                />
            </Card>

            {/* Modal Chi tiết đơn hàng */}
            <Modal
                title={`Chi tiết đơn hàng #${selectedOrder?._id?.slice(-8).toUpperCase()}`}
                open={isDetailModalOpen}
                onCancel={() => setIsDetailModalOpen(false)}
                footer={null}
                width={700}
            >
                {selectedOrder && (
                    <div>
                        <Descriptions bordered size='small' column={2}>
                            <Descriptions.Item label='Khách hàng' span={2}>
                                {selectedOrder.userId?.name} - {selectedOrder.userId?.email}
                            </Descriptions.Item>
                            <Descriptions.Item label='Trạng thái'>
                                {getStatusTag(selectedOrder.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label='Thanh toán'>
                                {selectedOrder.payment?.provider} - {getPaymentStatusTag(selectedOrder.payment?.status)}
                            </Descriptions.Item>
                            <Descriptions.Item label='Tổng tiền' span={2}>
                                <span className='text-lg font-bold text-green-600'>
                                    {formatPrice(selectedOrder.total)}
                                </span>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider>Địa chỉ giao hàng</Divider>
                        <Descriptions bordered size='small' column={1}>
                            <Descriptions.Item label='Người nhận'>
                                {selectedOrder.shippingAddress?.name} - {selectedOrder.shippingAddress?.phone}
                            </Descriptions.Item>
                            <Descriptions.Item label='Địa chỉ'>
                                {selectedOrder.shippingAddress?.addressLine}, {selectedOrder.shippingAddress?.ward},{' '}
                                {selectedOrder.shippingAddress?.city}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider>Sản phẩm ({selectedOrder.items?.length})</Divider>
                        <Table
                            dataSource={selectedOrder.items}
                            rowKey={(item) => item.productId?._id || item.productId}
                            size='small'
                            pagination={false}
                            columns={[
                                {
                                    title: 'Sản phẩm',
                                    dataIndex: 'name',
                                    key: 'name'
                                },
                                {
                                    title: 'Đơn giá',
                                    dataIndex: 'price',
                                    key: 'price',
                                    render: (price) => formatPrice(price)
                                },
                                {
                                    title: 'SL',
                                    dataIndex: 'quantity',
                                    key: 'quantity',
                                    align: 'center'
                                },
                                {
                                    title: 'Thành tiền',
                                    key: 'total',
                                    render: (_, record) => formatPrice(record.price * record.quantity)
                                }
                            ]}
                        />
                    </div>
                )}
            </Modal>

            {/* Modal Cập nhật trạng thái */}
            <Modal
                title='Cập nhật trạng thái đơn hàng'
                open={isStatusModalOpen}
                onCancel={() => setIsStatusModalOpen(false)}
                onOk={handleUpdateStatus}
                confirmLoading={updateStatusMutation.isPending}
                okText='Cập nhật'
                cancelText='Hủy'
            >
                <div className='py-4'>
                    <p className='mb-2'>Trạng thái hiện tại: {getStatusTag(selectedOrder?.status)}</p>
                    <Select
                        value={newStatus}
                        onChange={setNewStatus}
                        style={{ width: '100%' }}
                        placeholder='Chọn trạng thái mới'
                    >
                        {ORDER_STATUS_OPTIONS.map((opt) => (
                            <Select.Option key={opt.value} value={opt.value}>
                                <Tag color={opt.color}>{opt.label}</Tag>
                            </Select.Option>
                        ))}
                    </Select>
                </div>
            </Modal>

            {/* Modal Xác nhận thanh toán */}
            <Modal
                title='Xác nhận trạng thái thanh toán'
                open={isPaymentModalOpen}
                onCancel={() => setIsPaymentModalOpen(false)}
                onOk={handleVerifyPayment}
                confirmLoading={verifyPaymentMutation.isPending}
                okText='Xác nhận'
                cancelText='Hủy'
            >
                <div className='space-y-4 py-4'>
                    <div>
                        <p className='mb-2'>
                            Trạng thái hiện tại: {getPaymentStatusTag(selectedOrder?.payment?.status)}
                        </p>
                        <Select
                            value={newPaymentStatus}
                            onChange={setNewPaymentStatus}
                            style={{ width: '100%' }}
                            placeholder='Chọn trạng thái thanh toán'
                        >
                            {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                <Select.Option key={opt.value} value={opt.value}>
                                    <Tag color={opt.color}>{opt.label}</Tag>
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <p className='mb-2'>Mã giao dịch (tùy chọn):</p>
                        <Input
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder='Nhập mã giao dịch từ ngân hàng/ví'
                        />
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default OrderManagement
