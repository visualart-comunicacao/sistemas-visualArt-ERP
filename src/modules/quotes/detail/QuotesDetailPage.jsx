import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Space,
  Typography,
  Button,
  Tag,
  message,
  Modal,
  Descriptions,
  Table,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  StopOutlined,
  CopyOutlined,
  EditOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getQuote, approveQuote, convertQuote, cancelQuote, createQuote } from '@/api/quotes.api'
import { formatCentsBRL } from '@/shared/utils/money'

const { Title, Text } = Typography

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
      return <Tag>Pendente</Tag>
  }
}

function formatDim(w, h) {
  if (!w && !h) return '—'
  if (w && h) return `${w} x ${h} cm`
  return `${w || '—'} x ${h || '—'}`
}
export default function QuotesDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState(null)

  async function load() {
    try {
      setLoading(true)
      const data = await getQuote(id)
      setQuote(data)
    } catch (e) {
      message.error(e?.response?.data?.message || 'Erro ao carregar orçamento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const uiStatus = useMemo(() => getQuoteUiStatus(quote), [quote])
  const isCanceled = uiStatus === UI_STATUS.CANCELED
  const isApproved = uiStatus === UI_STATUS.APPROVED
  const isConverted = uiStatus === UI_STATUS.CONVERTED
  const canEdit = !isCanceled && !isConverted && !isApproved
  const canApprove = !isCanceled && !isConverted && !isApproved
  const canConvert = !isCanceled && !isConverted && isApproved
  const canCancel = !isCanceled && !isConverted

  function confirmApprove() {
    if (!quote) return
    Modal.confirm({
      title: 'Aprovar orçamento?',
      content: `Você vai aprovar o orçamento ${quote.code}.`,
      okText: 'Aprovar',
      cancelText: 'Voltar',
      async onOk() {
        try {
          await approveQuote(quote.id, { approved: true })
          message.success('Orçamento aprovado!')
          load()
        } catch (e) {
          message.error(e?.response?.data?.message || 'Erro ao aprovar.')
        }
      },
    })
  }

  function confirmConvert() {
    if (!quote) return
    Modal.confirm({
      title: 'Converter orçamento em pedido?',
      content: `Isso criará um PED e uma OS a partir de ${quote.code}.`,
      okText: 'Converter',
      cancelText: 'Voltar',
      async onOk() {
        try {
          const sale = await convertQuote(quote.id, {
            saleStatus: 'PENDING',
            createWorkOrder: true,
          })
          message.success(`Convertido! Pedido: ${sale?.code || 'criado'}`)
          load()
        } catch (e) {
          message.error(e?.response?.data?.message || 'Erro ao converter.')
        }
      },
    })
  }

  function confirmCancel() {
    if (!quote) return
    Modal.confirm({
      title: 'Cancelar orçamento?',
      content: `${quote.code} será cancelado e não poderá ser convertido.`,
      okText: 'Cancelar',
      okButtonProps: { danger: true },
      cancelText: 'Voltar',
      async onOk() {
        try {
          await cancelQuote(quote.id, { reason: 'Cancelado via ERP' })
          message.success('Orçamento cancelado!')
          load()
        } catch (e) {
          message.error(e?.response?.data?.message || 'Erro ao cancelar.')
        }
      },
    })
  }

  function confirmDuplicate() {
    if (!quote) return
    Modal.confirm({
      title: 'Duplicar orçamento?',
      content: `Será criado um novo orçamento copiando itens e valores de ${quote.code}.`,
      okText: 'Duplicar',
      cancelText: 'Voltar',
      async onOk() {
        try {
          const payload = {
            customerUserId: quote.userId,
            discountCents: quote.discountCents ?? 0,
            shippingCents: quote.shippingCents ?? 0,
            taxCents: quote.taxCents ?? 0,
            notes: quote.notes ?? undefined,
            internalNotes: `Duplicado de ${quote.code}\n${quote.internalNotes ?? ''}`.trim(),
            items: (quote.items ?? []).map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              width: it.width ?? null,
              height: it.height ?? null,
              optionIds: it.optionIds ?? [],
            })),
          }

          const created = await createQuote(payload)
          message.success(`Novo orçamento criado: ${created?.code || ''}`)
          navigate(`/quotes/${created.id}`)
        } catch (e) {
          message.error(e?.response?.data?.message || 'Erro ao duplicar orçamento.')
        }
      },
    })
  }

  const itemsColumns = useMemo(() => {
    return [
      {
        title: 'Item',
        key: 'item',
        render: (_, row) => (
          <Space direction="vertical" size={0}>
            <Text style={{ fontWeight: 600 }}>{row.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDim(row.width, row.height)}{' '}
              {row.optionIds?.length ? `• ${row.optionIds.length} opções` : ''}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Qtd',
        dataIndex: 'quantity',
        width: 90,
      },
      {
        title: 'Preço (un)',
        dataIndex: 'priceCents',
        width: 140,
        align: 'right',
        render: (v) => formatCentsBRL(v),
      },
      {
        title: 'Total',
        key: 'lineTotal',
        width: 140,
        align: 'right',
        render: (_, row) => formatCentsBRL((row.priceCents || 0) * (row.quantity || 0)),
      },
    ]
  }, [])

  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      {/* Header */}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={14}>
          <Space align="center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotes')} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {quote?.code ? `Orçamento ${quote.code}` : 'Orçamento'}
              </Title>
              <Text type="secondary">Detalhes, aprovação, conversão e gerenciamento.</Text>
            </div>
          </Space>
        </Col>

        <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Recarregar
            </Button>

            <Button icon={<CopyOutlined />} onClick={confirmDuplicate} disabled={!quote}>
              Duplicar
            </Button>

            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/quotes/${id}/edit`)}
              disabled={!canEdit}
            >
              Editar
            </Button>

            <Button icon={<CheckCircleOutlined />} onClick={confirmApprove} disabled={!canApprove}>
              Aprovar
            </Button>

            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={confirmConvert}
              disabled={!canConvert}
            >
              Converter
            </Button>

            <Button danger icon={<StopOutlined />} onClick={confirmCancel} disabled={!canCancel}>
              Cancelar
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Summary */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={10}>
          <Card title="Resumo" loading={loading}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Row justify="space-between" align="middle">
                <Text type="secondary">Status</Text>
                {renderStatusTag(uiStatus)}
              </Row>

              {quote?.saleFromQuote?.code ? (
                <Row justify="space-between">
                  <Text type="secondary">Pedido</Text>
                  <Text style={{ fontWeight: 600 }}>{quote.saleFromQuote.code}</Text>
                </Row>
              ) : null}

              {quote?.saleFromQuote?.workOrder?.code ? (
                <Row justify="space-between">
                  <Text type="secondary">OS</Text>
                  <Text style={{ fontWeight: 600 }}>
                    {quote.saleFromQuote.workOrder.code} • {quote.saleFromQuote.workOrder.status}
                  </Text>
                </Row>
              ) : null}

              <Divider style={{ margin: '8px 0' }} />

              <Row justify="space-between">
                <Text type="secondary">Subtotal</Text>
                <Text>{formatCentsBRL(quote?.subtotalCents ?? 0)}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Desconto</Text>
                <Text>- {formatCentsBRL(quote?.discountCents ?? 0)}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Frete</Text>
                <Text>+ {formatCentsBRL(quote?.shippingCents ?? 0)}</Text>
              </Row>
              <Row justify="space-between">
                <Text type="secondary">Imposto</Text>
                <Text>+ {formatCentsBRL(quote?.taxCents ?? 0)}</Text>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              <Row justify="space-between">
                <Text style={{ fontWeight: 700 }}>Total</Text>
                <Text style={{ fontWeight: 700 }}>{formatCentsBRL(quote?.totalCents ?? 0)}</Text>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="Cliente e datas" loading={loading}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Cliente">{quote?.user?.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Telefone">{quote?.user?.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Criado em">
                {quote?.createdAt ? dayjs(quote.createdAt).format('DD/MM/YYYY HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Aprovado em">
                {quote?.approvedAt ? dayjs(quote.approvedAt).format('DD/MM/YYYY HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cancelado em">
                {quote?.canceledAt ? dayjs(quote.canceledAt).format('DD/MM/YYYY HH:mm') : '—'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Observações">{quote?.notes || '—'}</Descriptions.Item>
              <Descriptions.Item label="Notas internas">
                {quote?.internalNotes || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Items */}
      <Card title={`Itens (${quote?.items?.length || 0})`} loading={loading}>
        <Table
          rowKey="id"
          columns={itemsColumns}
          dataSource={quote?.items || []}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}
