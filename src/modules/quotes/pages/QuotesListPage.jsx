import { useEffect, useMemo, useState } from 'react'
import {
  Row,
  Col,
  Space,
  Typography,
  Button,
  Input,
  Select,
  Table,
  Tag,
  message,
  Modal,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { listQuotes, cancelQuote, convertQuote, approveQuote } from '../../../api/quotes.api'
import { formatCentsBRL } from '../../../shared/utils/money'

const { Title, Text } = Typography

// status calculado da UI (não confundir com OrderStatus do prisma)
const UI_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  CONVERTED: 'CONVERTED',
  CANCELED: 'CANCELED',
}

function getQuoteUiStatus(q) {
  if (q?.canceledAt) return UI_STATUS.CANCELED
  if (q?.saleFromQuote) return UI_STATUS.CONVERTED
  if (q?.approvedAt) return UI_STATUS.APPROVED
  return UI_STATUS.PENDING
}

function renderStatusTag(uiStatus) {
  switch (uiStatus) {
    case UI_STATUS.CANCELED:
      return <Tag color="red">Cancelado</Tag>
    case UI_STATUS.CONVERTED:
      return <Tag color="green">Convertido</Tag>
    case UI_STATUS.APPROVED:
      return <Tag color="blue">Aprovado</Tag>
    default:
      return <Tag> Pendente</Tag>
  }
}

export default function QuotesListPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  // filtros
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(null) // UI_STATUS

  // paginação
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)

  async function load(next = {}) {
    try {
      setLoading(true)
      const p = next.page ?? page
      const ps = next.pageSize ?? pageSize

      // backend: você pode ignorar status/search e filtrar no front,
      // ou implementar filtros no backend. Aqui eu mando, mas também filtro no front como fallback.
      const params = {
        page: p,
        pageSize: ps,
        search: search || undefined,
        status: undefined, // status aqui é calculado; se quiser implementar, use um param uiStatus no backend
      }

      const res = await listQuotes(params)

      const data = res?.data ?? res?.items ?? res
      const arr = Array.isArray(data) ? data : []

      // fallback: filtra client-side por status calculado
      const filtered = status ? arr.filter((q) => getQuoteUiStatus(q) === status) : arr

      setRows(filtered)
      setTotal(res?.meta?.total ?? res?.meta?.totalItems ?? filtered.length)

      setPage(res?.meta?.page ?? p)
      setPageSize(res?.meta?.pageSize ?? ps)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Erro ao carregar orçamentos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function confirmApprove(row) {
    Modal.confirm({
      title: 'Aprovar orçamento?',
      content: `Ao aprovar, você libera a conversão para pedido. (${row.code})`,
      okText: 'Aprovar',
      cancelText: 'Voltar',
      async onOk() {
        try {
          await approveQuote(row.id, { approved: true })
          message.success('Orçamento aprovado!')
          load()
        } catch (err) {
          message.error(err?.response?.data?.message || 'Erro ao aprovar orçamento.')
        }
      },
    })
  }

  function confirmCancel(row) {
    Modal.confirm({
      title: 'Cancelar orçamento?',
      content: `${row.code} será cancelado.`,
      okText: 'Cancelar orçamento',
      okButtonProps: { danger: true },
      cancelText: 'Voltar',
      async onOk() {
        try {
          // se você não tiver endpoint cancel ainda, me fala que eu te passo.
          await cancelQuote(row.id, { internalNotes: 'Cancelado via ERP' })
          message.success('Orçamento cancelado!')
          load()
        } catch (err) {
          message.error(err?.response?.data?.message || 'Erro ao cancelar orçamento.')
        }
      },
    })
  }

  function confirmConvert(row) {
    Modal.confirm({
      title: 'Converter orçamento em pedido?',
      content: `Isso criará um PED e uma OS a partir de ${row.code}.`,
      okText: 'Converter',
      cancelText: 'Voltar',
      async onOk() {
        try {
          const sale = await convertQuote(row.id, {
            saleStatus: 'PENDING',
            createWorkOrder: true,
            // workOrder: { dueAt, priority, instructions } // opcional: você pode abrir um modal depois
          })
          message.success(`Convertido! Pedido: ${sale?.code || 'criado'}`)
          load()
        } catch (err) {
          message.error(err?.response?.data?.message || 'Erro ao converter.')
        }
      },
    })
  }

  const columns = useMemo(() => {
    return [
      {
        title: 'Código',
        dataIndex: 'code',
        key: 'code',
        width: 170,
        ellipsis: true,
        render: (v, row) => (
          <Space direction="vertical" size={0}>
            <Text style={{ fontWeight: 600 }}>{v}</Text>
            {row?.saleFromQuote?.code ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Pedido: {row.saleFromQuote.code}
              </Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: 'Cliente',
        key: 'customer',
        width: 260,
        ellipsis: true,
        render: (_, row) => (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row?.user?.name || '—'}
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
              {row?.user?.phone || ''}
            </div>
          </div>
        ),
      },
      {
        title: 'Status',
        key: 'uiStatus',
        width: 150,
        render: (_, row) => {
          const s = getQuoteUiStatus(row)
          return renderStatusTag(s)
        },
      },
      {
        title: 'Total',
        dataIndex: 'totalCents',
        key: 'totalCents',
        width: 140,
        align: 'right',
        render: (v) => formatCentsBRL(v),
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 170,
        responsive: ['md'],
        render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'),
      },
      {
        title: 'Ações',
        key: 'actions',
        width: 220,
        fixed: 'right',
        render: (_, row) => {
          const uiStatus = getQuoteUiStatus(row)
          const isCanceled = uiStatus === UI_STATUS.CANCELED
          const isApproved = uiStatus === UI_STATUS.APPROVED
          const isConverted = uiStatus === UI_STATUS.CONVERTED

          return (
            <Space size={8}>
              <Tooltip title="Ver orçamento">
                <Button icon={<EyeOutlined />} onClick={() => navigate(`/quotes/${row.id}`)} />
              </Tooltip>

              <Tooltip title="Aprovar orçamento">
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={() => confirmApprove(row)}
                  disabled={isCanceled || isApproved || isConverted}
                />
              </Tooltip>

              <Tooltip title="Converter em pedido">
                <Button
                  icon={<ArrowRightOutlined />}
                  onClick={() => confirmConvert(row)}
                  disabled={isCanceled || !isApproved || isConverted}
                />
              </Tooltip>

              <Tooltip title="Cancelar orçamento">
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => confirmCancel(row)}
                  disabled={isCanceled || isConverted}
                />
              </Tooltip>
            </Space>
          )
        },
      },
    ]
  }, [navigate])

  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      {/* Header */}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={14}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Orçamentos
            </Title>
            <Text type="secondary">Criar, aprovar, cancelar e converter em pedido (com OS).</Text>
          </div>
        </Col>

        <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => load()}>
              Recarregar
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/quotes/new')}>
              Novo orçamento
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filtros */}
      <Row gutter={[12, 12]} align="middle" style={{ width: '100%', minWidth: 0 }}>
        <Col xs={24} md={10} lg={8}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ORC..."
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
            onPressEnter={() => {
              setPage(1)
              load({ page: 1 })
            }}
          />
        </Col>

        <Col xs={12} md={6} lg={5}>
          <Select
            value={status}
            onChange={(v) => {
              setStatus(v ?? null)
              setPage(1)
            }}
            placeholder="Status"
            allowClear
            style={{ width: '100%' }}
            options={[
              { label: 'Pendente', value: UI_STATUS.PENDING },
              { label: 'Aprovado', value: UI_STATUS.APPROVED },
              { label: 'Convertido', value: UI_STATUS.CONVERTED },
              { label: 'Cancelado', value: UI_STATUS.CANCELED },
            ]}
          />
        </Col>

        <Col xs={12} md={4} lg={4}>
          <Button
            block
            icon={<SyncOutlined />}
            onClick={() => {
              setPage(1)
              load({ page: 1 })
            }}
          >
            Filtrar
          </Button>
        </Col>
      </Row>

      {/* Table */}
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
          onChange={(pagination) => {
            const nextPage = pagination.current || 1
            const nextSize = pagination.pageSize || pageSize
            setPage(nextPage)
            setPageSize(nextSize)
            load({ page: nextPage, pageSize: nextSize })
          }}
        />
      </div>
    </div>
  )
}
