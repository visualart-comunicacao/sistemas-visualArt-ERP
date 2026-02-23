import { useEffect, useMemo, useState } from 'react'
import { Modal, Input, Table, Space, Button, Typography, message, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { listProducts } from '@/api/products.api'
import { formatCentsBRL } from '@/shared/utils/money'

const { Text } = Typography

function normalizeProduct(p) {
  // ✅ seu preço principal vem daqui:
  const priceCents =
    Number(p?.minPriceCents ?? 0) ||
    Number(p?.baseUnitPriceCents ?? 0) ||
    Number(p?.baseM2PriceCents ?? 0) ||
    Number(p?.baseLinearMPriceCents ?? 0) ||
    0

  return { ...p, priceCents }
}

export default function ProductPickerModal({ open, onClose, onPick }) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  async function load(next = {}) {
    try {
      setLoading(true)
      const p = next.page ?? page
      const ps = next.pageSize ?? pageSize

      const params = {
        page: p,
        pageSize: ps,
        search: search || undefined,
        active: true,
      }

      const res = await listProducts(params)
      const data = res?.data ?? res?.items ?? res

      const normalized = (Array.isArray(data) ? data : []).map(normalizeProduct)

      setRows(normalized)
      setTotal(res?.meta?.total ?? res?.meta?.totalItems ?? normalized.length)
      setPage(res?.meta?.page ?? p)
      setPageSize(res?.meta?.pageSize ?? ps)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    setSearch('')
    setPage(1)
    setPageSize(10)
    load({ page: 1, pageSize: 10 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const columns = useMemo(
    () => [
      { title: 'Nome', dataIndex: 'name', key: 'name', width: 300, ellipsis: true },
      {
        title: 'Categoria',
        key: 'category',
        width: 170,
        responsive: ['md'],
        render: (_, r) => r?.category?.name || '—',
      },
      {
        title: 'Modelo',
        dataIndex: 'pricingModel',
        key: 'pricingModel',
        width: 130,
        responsive: ['md'],
        render: (v) => (v ? <Tag>{v}</Tag> : '—'),
      },
      {
        title: 'Preço',
        key: 'price',
        width: 150,
        align: 'right',
        render: (_, r) => {
          const cents = Number(r?.priceCents || 0)
          return cents > 0 ? (
            <Text strong>{formatCentsBRL(cents)}</Text>
          ) : (
            <Text type="secondary">—</Text>
          )
        },
      },
      {
        title: 'Ação',
        key: 'action',
        width: 120,
        fixed: 'right',
        render: (_, r) => (
          <Button
            type="primary"
            onClick={() => {
              // ✅ garante que onPick receba priceCents
              onPick?.(r)
            }}
          >
            Selecionar
          </Button>
        ),
      },
    ],
    [onPick],
  )

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Buscar produto"
      width={960}
      destroyOnClose
      footer={null}
      styles={{ body: { paddingTop: 8 } }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
          placeholder="Buscar produto pelo nome..."
          onPressEnter={() => load({ page: 1 })}
        />

        <Text type="secondary">Clique em “Selecionar” para preencher o item do orçamento.</Text>

        <div style={{ minWidth: 0 }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={rows}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
            }}
            onChange={(p) => {
              load({ page: p.current, pageSize: p.pageSize })
            }}
          />
        </div>
      </Space>
    </Modal>
  )
}
