import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Modal,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { listCustomers, removeCustomer } from '@/api/customers.api'
import CustomerModal from '../components/CustomerModal'

const { Title, Text } = Typography

export default function CustomersListPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  // filtros
  const [search, setSearch] = useState('')
  const [type, setType] = useState(null) // PERSON | BUSINESS
  const [isBlocked, setIsBlocked] = useState(null) // true | false
  const [isActive, setIsActive] = useState(null) // true | false

  // paginação server-side
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)

  // modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // create | edit
  const [selectedId, setSelectedId] = useState(null)

  async function load(next = {}) {
    try {
      setLoading(true)

      const p = next.page ?? page
      const ps = next.pageSize ?? pageSize

      const params = {
        search: search || undefined,
        type: type || undefined,
        isBlocked: isBlocked ?? undefined,
        isActive: isActive ?? undefined,
        page: p,
        pageSize: ps,
      }

      const res = await listCustomers(params)

      setRows(res?.data || [])
      setTotal(res?.meta?.total ?? res?.meta?.totalItems ?? res?.data?.length ?? 0)

      // mantém estados em sync
      setPage(res?.meta?.page ?? p)
      setPageSize(res?.meta?.pageSize ?? ps)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setSelectedId(null)
    setModalMode('create')
    setModalOpen(true)
  }

  function openEdit(id) {
    setSelectedId(id)
    setModalMode('edit')
    setModalOpen(true)
  }

  function confirmDisable(row) {
    Modal.confirm({
      title: 'Inativar cliente?',
      content: `O cliente "${row.name}" será marcado como inativo (soft delete).`,
      okText: 'Inativar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await removeCustomer(row.id)
          message.success('Cliente inativado!')
          await load()
        } catch (err) {
          message.error(err?.response?.data?.message || 'Erro ao inativar cliente.')
        }
      },
    })
  }

  const columns = useMemo(
    () => [
      {
        title: 'Nome',
        dataIndex: 'name',
        key: 'name',
        width: 220,
        ellipsis: true,
      },

      // 👇 só aparece no desktop (md+)
      {
        title: 'Tipo',
        key: 'type',
        width: 90,
        responsive: ['md'],
        render: (_, row) =>
          row?.profile?.type === 'BUSINESS' ? (
            <Tag color="blue">PJ</Tag>
          ) : (
            <Tag color="green">PF</Tag>
          ),
      },

      // 👇 sempre aparece (mobile + desktop), mas no mobile vira a principal info
      {
        title: 'Contato',
        key: 'contact',
        width: 260,
        render: (_, row) => (
          <div style={{ minWidth: 0 }}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {row.email || <Text type="secondary">—</Text>}
            </div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.phone || '—'}
            </div>
          </div>
        ),
      },

      // 👇 só aparece no desktop (md+)
      {
        title: 'Status',
        key: 'status',
        width: 220,
        responsive: ['md'],
        render: (_, row) => (
          <Space size={6} wrap>
            {(row.isActive ?? true) ? <Tag color="green">Ativo</Tag> : <Tag>Inativo</Tag>}
            {row?.profile?.isBlocked ? <Tag color="red">Bloqueado</Tag> : null}
            {row.isErpOnly ? <Tag color="purple">ERP</Tag> : null}
          </Space>
        ),
      },

      {
        title: 'Ações',
        key: 'actions',
        width: 140,
        fixed: 'right',
        render: (_, row) => (
          <Space size={8}>
            <Button icon={<EditOutlined />} onClick={() => openEdit(row.id)} />
            <Button danger icon={<StopOutlined />} onClick={() => confirmDisable(row)} />
          </Space>
        ),
      },
    ],
    [],
  )

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={14}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Clientes
            </Title>
            <Text type="secondary">
              ERP Customers (PF/PJ) com paginação e manutenção via modal.
            </Text>
          </div>
        </Col>
      </Row>
      <Row>
        <Col xs={24} md={4}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Novo cliente
          </Button>
        </Col>
        <Col xs={24} md={4}>
          <Button icon={<ReloadOutlined />} onClick={() => load()}>
            Recarregar
          </Button>
        </Col>
      </Row>

      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={24} md={24} lg={8}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome/telefone/CPF/CNPJ..."
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
            onPressEnter={() => {
              setPage(1)
              load({ page: 1 })
            }}
          />
        </Col>

        <Col xs={12} sm={8} md={4} lg={4}>
          <Select
            value={type}
            onChange={(v) => {
              setType(v)
              setPage(1)
            }}
            placeholder="Tipo"
            allowClear
            style={{ width: '100%' }}
            options={[
              { label: 'PF', value: 'PERSON' },
              { label: 'PJ', value: 'BUSINESS' },
            ]}
          />
        </Col>

        <Col xs={12} sm={8} md={4} lg={4}>
          <Select
            value={isActive}
            onChange={(v) => {
              setIsActive(v)
              setPage(1)
            }}
            placeholder="Ativo"
            allowClear
            style={{ width: '100%' }}
            options={[
              { label: 'Ativo', value: true },
              { label: 'Inativo', value: false },
            ]}
          />
        </Col>

        <Col xs={12} sm={8} md={4} lg={4}>
          <Select
            value={isBlocked}
            onChange={(v) => {
              setIsBlocked(v)
              setPage(1)
            }}
            placeholder="Bloqueado"
            allowClear
            style={{ width: '100%' }}
            options={[
              { label: 'Sim', value: true },
              { label: 'Não', value: false },
            ]}
          />
        </Col>

        <Col xs={12} sm={8} md={2} lg={4}>
          <Button
            block
            onClick={() => {
              setPage(1)
              load({ page: 1 })
            }}
          >
            Filtrar
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 900 }} // 👈 força layout decente em telas pequenas
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
        }}
        onChange={(pagination) => {
          const nextPage = pagination.current || 1
          const nextSize = pagination.pageSize || pageSize
          setPage(nextPage)
          setPageSize(nextSize)
          load({ page: nextPage, pageSize: nextSize })
        }}
      />

      <CustomerModal
        open={modalOpen}
        mode={modalMode}
        customerId={selectedId}
        onClose={() => setModalOpen(false)}
        onSuccess={() => load()}
      />
    </div>
  )
}
