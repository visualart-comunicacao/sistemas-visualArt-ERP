import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Space,
  Typography,
  Button,
  Input,
  InputNumber,
  Select,
  Table,
  Tag,
  Divider,
  message,
  Modal,
  Form,
  Spin,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { listProducts } from '@/api/products.api'
import { createQuote } from '@/api/quotes.api'
import { listCustomers } from '@/api/customers.api'
import { formatCentsBRL } from '@/shared/utils/money'

const { Title, Text } = Typography

function safeArray(res) {
  const data = res?.data ?? res?.items ?? res
  return Array.isArray(data) ? data : []
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0)
}

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function QuoteCreatePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const [saving, setSaving] = useState(false)

  // customers autocomplete
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customers, setCustomers] = useState([]) // cache local
  const [customerSearch, setCustomerSearch] = useState('')
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 350)
  const customersReqId = useRef(0)

  // products
  const [productsLoading, setProductsLoading] = useState(false)
  const [products, setProducts] = useState([])
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  // quote items
  const [items, setItems] = useState([]) // { key, productId, quantity, width, height, optionIds }

  // product picker modal
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const debouncedPickerSearch = useDebouncedValue(pickerSearch, 250)

  async function loadProducts() {
    try {
      setProductsLoading(true)
      const res = await listProducts({ includeOptions: true })
      setProducts(safeArray(res))
    } catch (e) {
      message.error(e?.response?.data?.message || 'Erro ao carregar produtos.')
    } finally {
      setProductsLoading(false)
    }
  }

  async function loadCustomers(q = '') {
    const rid = ++customersReqId.current
    try {
      setCustomersLoading(true)
      const res = await listCustomers({ search: q, page: 1, pageSize: 20 })
      if (rid !== customersReqId.current) return
      setCustomers(safeArray(res))
    } catch (e) {
      if (rid !== customersReqId.current) return
      message.error(e?.response?.data?.message || 'Erro ao carregar clientes.')
    } finally {
      if (rid === customersReqId.current) setCustomersLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadCustomers('')
  }, [])

  useEffect(() => {
    loadCustomers(debouncedCustomerSearch)
  }, [debouncedCustomerSearch])

  function addItem(product) {
    setItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID?.() || String(Date.now() + Math.random()),
        productId: product.id,
        quantity: 1,
        width: null,
        height: null,
        optionIds: [],
      },
    ])
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((it) => it.key !== key))
  }

  function updateItem(key, patch) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }

  function openOptionsModal(item) {
    const product = productsById.get(item.productId)
    if (!product) return

    const groups =
      product.optionGroups?.map((g) => ({
        id: g.id,
        name: g.name,
        required: g.required,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: (g.options || [])
          .filter((o) => o.active !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      })) ?? []

    let selected = new Set(item.optionIds || [])

    Modal.confirm({
      title: `Opções • ${product.name}`,
      width: 780,
      okText: 'Salvar opções',
      cancelText: 'Voltar',
      content: (
        <div style={{ display: 'grid', gap: 12 }}>
          {groups.length === 0 ? (
            <Text type="secondary">Este produto não possui opções.</Text>
          ) : (
            groups.map((g) => (
              <Card
                key={g.id}
                size="small"
                title={
                  <Space>
                    <span>{g.name}</span>
                    {g.required ? <Tag color="blue">Obrigatório</Tag> : <Tag>Opcional</Tag>}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      min {g.required ? Math.max(1, g.minSelect) : g.minSelect} • max {g.maxSelect}
                    </Text>
                  </Space>
                }
              >
                <Space wrap>
                  {g.options.map((opt) => {
                    const checked = selected.has(opt.id)
                    return (
                      <Tag
                        key={opt.id}
                        color={checked ? 'blue' : 'default'}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                          if (selected.has(opt.id)) selected.delete(opt.id)
                          else selected.add(opt.id)
                        }}
                      >
                        {opt.name}
                      </Tag>
                    )
                  })}
                </Space>
              </Card>
            ))
          )}
        </div>
      ),
      onOk: async () => {
        // valida min/max por grupo (backend valida de novo)
        for (const g of groups) {
          const selectedInGroup = g.options.filter((o) => selected.has(o.id))
          const minRequired = g.required ? Math.max(1, g.minSelect) : g.minSelect
          if (selectedInGroup.length < minRequired) {
            message.error(`Selecione pelo menos ${minRequired} opção(ões) em: ${g.name}`)
            throw new Error('Validation')
          }
          if (selectedInGroup.length > g.maxSelect) {
            message.error(`Selecione no máximo ${g.maxSelect} opção(ões) em: ${g.name}`)
            throw new Error('Validation')
          }
        }

        updateItem(item.key, { optionIds: Array.from(selected) })
      },
    })
  }

  // preview simples (o preço real é do backend)
  const previewSubtotalCents = useMemo(() => {
    const totals = items.map((it) => {
      const p = productsById.get(it.productId)
      const base = p?.minPriceCents ?? p?.baseUnitPriceCents ?? 0
      return base * (it.quantity || 1)
    })
    return sum(totals)
  }, [items, productsById])

  const discountCents = Form.useWatch('discountCents', form) ?? 0
  const shippingCents = Form.useWatch('shippingCents', form) ?? 0
  const taxCents = Form.useWatch('taxCents', form) ?? 0

  const previewTotalCents = useMemo(() => {
    return Math.max(
      0,
      previewSubtotalCents - (discountCents || 0) + (shippingCents || 0) + (taxCents || 0),
    )
  }, [previewSubtotalCents, discountCents, shippingCents, taxCents])

  async function onSubmit() {
    try {
      const values = await form.validateFields()

      if (!items.length) {
        message.error('Adicione pelo menos 1 produto.')
        return
      }

      // valida dimensões mínimas (básico)
      for (const it of items) {
        if (!it.productId) {
          message.error('Item inválido: produto não definido.')
          return
        }
        if (!it.quantity || it.quantity < 1) {
          message.error('Quantidade deve ser ≥ 1.')
          return
        }
      }

      setSaving(true)

      const payload = {
        customerUserId: values.customerUserId,
        discountCents: values.discountCents || 0,
        shippingCents: values.shippingCents || 0,
        taxCents: values.taxCents || 0,
        notes: values.notes || undefined,
        internalNotes: values.internalNotes || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          width: it.width ?? null,
          height: it.height ?? null,
          optionIds: it.optionIds ?? [],
        })),
      }

      const created = await createQuote(payload)
      message.success(`Orçamento criado: ${created?.code || ''}`)
      navigate(`/quotes/${created.id}`)
    } catch (e) {
      if (e?.message === 'Validation') return
      message.error(e?.response?.data?.message || 'Erro ao criar orçamento.')
    } finally {
      setSaving(false)
    }
  }

  const customerOptions = useMemo(() => {
    return customers.map((c) => ({
      value: c.userId ?? c.id, // dependendo do teu modelo erp-customers
      label: (
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {c.name || c.fullName || c.companyName || c.tradeName || 'Cliente'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {(c.phone || c.whatsapp || c.email || '').toString()}
          </div>
        </div>
      ),
    }))
  }, [customers])

  const pickerData = useMemo(() => {
    const q = debouncedPickerSearch.trim().toLowerCase()
    const base = products.filter((p) => p.active !== false)
    if (!q) return base
    return base.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q),
    )
  }, [products, debouncedPickerSearch])

  const columns = useMemo(() => {
    return [
      {
        title: 'Produto',
        key: 'product',
        render: (_, row) => {
          const p = productsById.get(row.productId)
          return (
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p?.name || '—'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {p?.pricingModel ? <Tag style={{ margin: 0 }}>{p.pricingModel}</Tag> : null}
              </div>
            </div>
          )
        },
      },
      {
        title: 'Qtd',
        dataIndex: 'quantity',
        width: 110,
        render: (v, row) => (
          <InputNumber
            min={1}
            value={v}
            onChange={(n) => updateItem(row.key, { quantity: n || 1 })}
          />
        ),
      },
      {
        title: 'Largura',
        dataIndex: 'width',
        width: 140,
        render: (v, row) => (
          <InputNumber
            min={1}
            value={v}
            placeholder="cm"
            onChange={(n) => updateItem(row.key, { width: n ?? null })}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: 'Altura',
        dataIndex: 'height',
        width: 140,
        render: (v, row) => (
          <InputNumber
            min={1}
            value={v}
            placeholder="cm"
            onChange={(n) => updateItem(row.key, { height: n ?? null })}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: 'Opções',
        key: 'options',
        width: 170,
        render: (_, row) => {
          const product = productsById.get(row.productId)
          const hasOptions = (product?.optionGroups?.length ?? 0) > 0
          return (
            <Button onClick={() => openOptionsModal(row)} disabled={productsLoading || !hasOptions}>
              {hasOptions ? `Selecionar (${row.optionIds?.length || 0})` : 'Sem opções'}
            </Button>
          )
        },
      },
      {
        title: '',
        key: 'remove',
        width: 60,
        align: 'right',
        render: (_, row) => (
          <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(row.key)} />
        ),
      },
    ]
  }, [productsById, productsLoading])

  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      {/* Header */}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={14}>
          <Space align="center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotes')} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Novo orçamento
              </Title>
              <Text type="secondary">Selecione cliente, adicione itens e salve.</Text>
            </div>
          </Space>
        </Col>

        <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space wrap>
            <Button onClick={() => setPickerOpen(true)} icon={<PlusOutlined />}>
              Adicionar produto
            </Button>
            <Button type="primary" loading={saving} onClick={onSubmit}>
              Salvar orçamento
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        {/* Cliente + notas */}
        <Col xs={24} lg={10}>
          <Card title="Cliente e observações">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                discountCents: 0,
                shippingCents: 0,
                taxCents: 0,
              }}
            >
              <Form.Item
                label="Cliente"
                name="customerUserId"
                rules={[{ required: true, message: 'Selecione o cliente.' }]}
              >
                <Select
                  showSearch
                  allowClear
                  placeholder="Buscar cliente..."
                  filterOption={false}
                  onSearch={(v) => setCustomerSearch(v)}
                  notFoundContent={customersLoading ? <Spin size="small" /> : 'Nenhum cliente'}
                  options={customerOptions}
                  loading={customersLoading}
                />
              </Form.Item>

              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <Form.Item label="Desconto (centavos)" name="discountCents">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Frete (centavos)" name="shippingCents">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Imposto (centavos)" name="taxCents">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Observações (cliente)" name="notes">
                <Input.TextArea rows={3} placeholder="Ex.: prazo, condições, instalação..." />
              </Form.Item>

              <Form.Item label="Notas internas" name="internalNotes">
                <Input.TextArea
                  rows={3}
                  placeholder="Ex.: margem, fornecedor, instruções internas..."
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Itens */}
        <Col xs={24} lg={14}>
          <Card
            title="Itens do orçamento"
            extra={
              <Button onClick={() => setPickerOpen(true)} icon={<PlusOutlined />}>
                Adicionar
              </Button>
            }
          >
            <Table
              rowKey="key"
              columns={columns}
              dataSource={items}
              pagination={false}
              locale={{ emptyText: 'Nenhum item. Clique em "Adicionar produto".' }}
              scroll={{ x: 'max-content' }}
            />

            <Divider />

            <Row gutter={[12, 12]} justify="end">
              <Col xs={24} md={12} lg={10}>
                <Card size="small" style={{ background: '#fafafa' }}>
                  <Space direction="vertical" style={{ width: '100%' }} size={6}>
                    <Row justify="space-between">
                      <Text type="secondary">Subtotal (prévia)</Text>
                      <Text>{formatCentsBRL(previewSubtotalCents)}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text type="secondary">Desconto</Text>
                      <Text>- {formatCentsBRL(discountCents || 0)}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text type="secondary">Frete</Text>
                      <Text>+ {formatCentsBRL(shippingCents || 0)}</Text>
                    </Row>
                    <Row justify="space-between">
                      <Text type="secondary">Imposto</Text>
                      <Text>+ {formatCentsBRL(taxCents || 0)}</Text>
                    </Row>
                    <Divider style={{ margin: '8px 0' }} />
                    <Row justify="space-between">
                      <Text style={{ fontWeight: 700 }}>Total (prévia)</Text>
                      <Text style={{ fontWeight: 700 }}>{formatCentsBRL(previewTotalCents)}</Text>
                    </Row>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      * O valor final é calculado no backend (dimensões + opções + modelo de preço).
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Modal: Product Picker */}
      <Modal
        title="Adicionar produto"
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        footer={null}
        width={860}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Buscar produto..."
            allowClear
          />

          <Table
            rowKey="id"
            loading={productsLoading}
            dataSource={pickerData}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: 'Produto',
                dataIndex: 'name',
                render: (v, row) => (
                  <Space direction="vertical" size={0}>
                    <Text style={{ fontWeight: 600 }}>{v}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {row.pricingModel}{' '}
                      {row.minPriceCents ? `• mín ${formatCentsBRL(row.minPriceCents)}` : ''}
                    </Text>
                  </Space>
                ),
              },
              {
                title: '',
                width: 140,
                align: 'right',
                render: (_, row) => (
                  <Button
                    type="primary"
                    onClick={() => {
                      addItem(row)
                      setPickerOpen(false)
                      setPickerSearch('')
                    }}
                  >
                    Adicionar
                  </Button>
                ),
              },
            ]}
          />
        </Space>
      </Modal>
    </div>
  )
}
