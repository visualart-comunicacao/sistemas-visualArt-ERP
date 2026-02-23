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
} from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  listProducts,
  listCategories,
  desactivateProduct,
  activateProduct,
} from '@/api/catalog.api'

const { Title, Text } = Typography

const PRICING_MODEL_OPTIONS = [
  { label: 'Unitário', value: 'UNIT' },
  { label: 'Área (m²)', value: 'AREA_M2' },
  { label: 'Metro linear', value: 'LINEAR_M' },
  { label: 'Sob orçamento', value: 'QUOTE' },
]

export default function ProductsListPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  const [search, setSearch] = useState('')
  const [active, setActive] = useState(null)
  const [pricingModel, setPricingModel] = useState(null)
  const [categoryId, setCategoryId] = useState(null)

  const [categories, setCategories] = useState([])
  const [catsLoading, setCatsLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [total, setTotal] = useState(0)

  async function loadCategories() {
    try {
      setCatsLoading(true)
      const res = await listCategories({ page: 1, pageSize: 200 })
      setCategories(res?.data || res || [])
    } catch {
      // silencioso
    } finally {
      setCatsLoading(false)
    }
  }

  async function load(next = {}) {
    try {
      setLoading(true)
      const p = next.page ?? page
      const ps = next.pageSize ?? pageSize

      const params = {
        page: p,
        pageSize: ps,
        search: search || undefined,
        active: active ?? undefined,
        pricingModel: pricingModel || undefined,
        categoryId: categoryId || undefined,
      }

      const res = await listProducts(params)
      const data = res?.data ?? res?.items ?? res

      setRows(Array.isArray(data) ? data : [])
      setTotal(res?.meta?.total ?? res?.meta?.totalItems ?? (Array.isArray(data) ? data.length : 0))

      setPage(res?.meta?.page ?? p)
      setPageSize(res?.meta?.pageSize ?? ps)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function confirmToggle(row) {
    const willActivate = !row.active
    Modal.confirm({
      title: willActivate ? 'Ativar produto?' : 'Inativar produto?',
      content: willActivate
        ? `O produto "${row.name}" ficará ativo no catálogo.`
        : `O produto "${row.name}" ficará inativo (não aparecerá para vendas).`,
      okText: willActivate ? 'Ativar' : 'Inativar',
      okButtonProps: willActivate ? {} : { danger: true },
      cancelText: 'Cancelar',
      async onOk() {
        try {
          if (willActivate) await activateProduct(row.id)
          else await desactivateProduct(row.id)

          message.success(willActivate ? 'Produto ativado!' : 'Produto inativado!')
          load()
        } catch (err) {
          message.error(err?.response?.data?.message || 'Erro ao atualizar status.')
        }
      },
    })
  }

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: c.id })),
    [categories],
  )

  const columns = useMemo(
    () => [
      {
        title: 'Produto',
        key: 'product',
        width: 320,
        render: (_, r) => (
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {r.name}
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
              {r.description || '—'}
            </div>
          </div>
        ),
      },
      {
        title: 'Categoria',
        key: 'category',
        width: 180,
        responsive: ['md'],
        render: (_, r) => r?.category?.name || '—',
      },
      {
        title: 'Modelo',
        dataIndex: 'pricingModel',
        key: 'pricingModel',
        width: 140,
        responsive: ['md'],
        render: (v) => <Tag>{v}</Tag>,
      },
      {
        title: 'Status',
        key: 'status',
        width: 80,
        render: (_, r) => (r.active ? <Tag color="green">Ativo</Tag> : <Tag>Inativo</Tag>),
      },
      {
        title: 'Atualizado',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 160,
        responsive: ['lg'],
        render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'),
      },
      {
        title: 'Ações',
        key: 'actions',
        width: 80,
        fixed: 'right',
        render: (_, r) => (
          <Space size={8}>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/catalog/products/${r.id}/edit`)}
            />
            <Button
              danger={!r.active}
              icon={r.active ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => confirmToggle(r)}
            />
          </Space>
        ),
      },
    ],
    [navigate],
  )

  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      {/* header responsivo */}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={14}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Catálogo • Produtos
            </Title>
            <Text type="secondary">Cadastro e manutenção dos produtos e regras de preço.</Text>
          </div>
        </Col>

        <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => load()}>
              Recarregar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/catalog/products/new')}
            >
              Novo produto
            </Button>
          </Space>
        </Col>
      </Row>

      {/* filtros responsivos */}
      <Row gutter={[12, 12]} align="middle" style={{ width: '100%', minWidth: 0 }}>
        <Col xs={24} md={8} lg={7}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome/slug..."
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: '100%' }}
            onPressEnter={() => load({ page: 1 })}
          />
        </Col>

        <Col xs={12} md={5} lg={4}>
          <Select
            value={active}
            onChange={(v) => {
              setActive(v)
            }}
            placeholder="Status"
            allowClear
            style={{ width: '100%' }}
            options={[
              { label: 'Ativo', value: true },
              { label: 'Inativo', value: false },
            ]}
          />
        </Col>

        <Col xs={12} md={6} lg={5}>
          <Select
            value={pricingModel}
            onChange={(v) => setPricingModel(v)}
            placeholder="Modelo"
            allowClear
            style={{ width: '100%' }}
            options={PRICING_MODEL_OPTIONS}
          />
        </Col>

        <Col xs={24} md={5} lg={5}>
          <Select
            value={categoryId}
            onChange={(v) => setCategoryId(v)}
            placeholder="Categoria"
            allowClear
            loading={catsLoading}
            style={{ width: '100%' }}
            options={categoryOptions}
          />
        </Col>

        <Col xs={24} md={4} lg={4}>
          <Button block onClick={() => load({ page: 1 })}>
            Filtrar
          </Button>
        </Col>
      </Row>

      {/* tabela responsiva */}
      <div style={{ minWidth: 0 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true }}
          onChange={(p) => load({ page: p.current, pageSize: p.pageSize })}
        />
      </div>
    </div>
  )
}
