import { useEffect, useMemo, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Space,
  Typography,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Tabs,
  Divider,
  message,
  Empty,
  Collapse,
  Table,
  Tag,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, LinkOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  updateProduct,
  getProduct,
  listCategories,
  updateStock,
  addProductImage,
  addOptionGroup,
  addOption,
} from '@/api/catalog.api'
import { Upload, Image } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { uploadProductImage } from '@/api/uploads.api'
import { toAbsoluteUrl } from '@/shared/utils/url'

import { slugify } from '@/shared/utils/slugify'

const { Title, Text } = Typography

const PRICING_MODEL_OPTIONS = [
  { label: 'Unitário', value: 'UNIT' },
  { label: 'Área (m²)', value: 'AREA_M2' },
  { label: 'Metro linear', value: 'LINEAR_M' },
  { label: 'Sob orçamento', value: 'QUOTE' },
]

const DIMENSION_UNIT_OPTIONS = [
  { label: 'Milímetros', value: 'MM' },
  { label: 'Centímetros', value: 'CM' },
]

const MODIFIER_TYPE_OPTIONS = [
  { label: 'Valor fixo (centavos)', value: 'FIXED_CENTS' },
  { label: 'Por m² (centavos)', value: 'PER_M2_CENTS' },
  { label: 'Percentual (%)', value: 'PERCENT' },
]

export default function ProductEditPage({ mode = 'create' }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const navigate = useNavigate()

  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [slugTouched, setSlugTouched] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [product, setProduct] = useState(null)

  // imagens
  const [imgForm] = Form.useForm()
  const [imgLoading, setImgLoading] = useState(false)

  // option group / option
  const [groupForm] = Form.useForm()
  const [groupLoading, setGroupLoading] = useState(false)

  const [optionForm] = Form.useForm()
  const [optionLoading, setOptionLoading] = useState(false)
  const [optionTargetGroupId, setOptionTargetGroupId] = useState(null)

  const pricingModel = Form.useWatch('pricingModel', form)

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: c.id })),
    [categories],
  )

  async function handleUploadRequest({ file, onSuccess, onError }) {
    try {
      const data = await uploadProductImage(file) // { url: "/uploads/products/..." }
      onSuccess(data, file) // <-- CRÍTICO: passar (response, file)
    } catch (e) {
      onError(e)
    }
  }

  async function onUploadedBindToProduct(uploadRes, altText = '') {
    if (!id) return
    try {
      console.log('payload images:', { url: uploadRes.url, alt: altText || null })

      await addProductImage(id, { url: uploadRes.url, alt: altText || '' })
      message.success('Imagem enviada e vinculada ao produto!')
      await loadProduct()
    } catch (error) {
      message.error('Erro ao vincular imagem ao produto.')
      console.log('Error details:', error)
    }
  }

  async function loadCategories() {
    try {
      const res = await listCategories({ page: 1, pageSize: 200 })
      setCategories(res?.data || res || [])
    } catch {
      // silencioso
    }
  }

  async function loadProduct() {
    if (!isEdit || !id) return
    try {
      setLoading(true)
      const p = await getProduct(id)
      setProduct(p)

      form.setFieldsValue({
        name: p.name,
        slug: p.slug,
        description: p.description || null,
        active: p.active ?? true,
        categoryId: p.categoryId || null,

        pricingModel: p.pricingModel,
        dimensionUnit: p.dimensionUnit,

        minWidth: p.minWidth ?? null,
        maxWidth: p.maxWidth ?? null,
        minHeight: p.minHeight ?? null,
        maxHeight: p.maxHeight ?? null,
        step: p.step ?? null,

        minAreaM2: p.minAreaM2 ?? null,
        minPriceCents: p.minPriceCents ?? null,

        baseUnitPriceCents: p.baseUnitPriceCents ?? null,
        baseM2PriceCents: p.baseM2PriceCents ?? null,
        baseLinearMPriceCents: p.baseLinearMPriceCents ?? null,

        stockQuantity: p?.stock?.quantity ?? null,
      })

      setSlugTouched(true)
    } catch (err) {
      message.error(err?.response?.data?.message || 'Erro ao carregar produto.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function cleanPayloadByPricingModel(v) {
    const payload = {
      name: v.name,
      slug: v.slug,
      description: v.description || null,
      active: v.active ?? true,
      categoryId: v.categoryId || null,

      pricingModel: v.pricingModel,

      dimensionUnit: v.dimensionUnit,
      minWidth: v.minWidth ?? null,
      maxWidth: v.maxWidth ?? null,
      minHeight: v.minHeight ?? null,
      maxHeight: v.maxHeight ?? null,
      step: v.step ?? null,

      minAreaM2: v.minAreaM2 ?? null,
      minPriceCents: v.minPriceCents ?? null,

      baseUnitPriceCents: v.baseUnitPriceCents ?? null,
      baseM2PriceCents: v.baseM2PriceCents ?? null,
      baseLinearMPriceCents: v.baseLinearMPriceCents ?? null,
    }

    if (v.pricingModel !== 'UNIT') payload.baseUnitPriceCents = null
    if (v.pricingModel !== 'AREA_M2') payload.baseM2PriceCents = null
    if (v.pricingModel !== 'LINEAR_M') payload.baseLinearMPriceCents = null

    if (v.pricingModel === 'QUOTE') {
      payload.baseUnitPriceCents = null
      payload.baseM2PriceCents = null
      payload.baseLinearMPriceCents = null
    }

    return payload
  }

  async function onSave() {
    try {
      const v = await form.validateFields()
      setLoading(true)

      const payload = cleanPayloadByPricingModel(v)

      const saved = isEdit ? await updateProduct(id, payload) : await createProduct(payload)
      const productId = isEdit ? id : saved?.id

      if (productId && v.stockQuantity != null) {
        await updateStock(productId, { quantity: Number(v.stockQuantity) })
      }

      message.success(isEdit ? 'Produto atualizado!' : 'Produto criado!')

      if (!isEdit && saved?.id) {
        navigate(`/catalog/products/${saved.id}/edit`, { replace: true })
        return
      }

      navigate('/catalog/products')
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Erro ao salvar produto.')
    } finally {
      setLoading(false)
    }
  }

  // ===== IMAGENS =====
  async function onAddImage() {
    if (!isEdit || !id) return message.info('Salve o produto antes de adicionar imagens.')

    try {
      const v = await imgForm.validateFields()
      setImgLoading(true)

      await addProductImage(id, { url: v.url, alt: v.alt || null })

      message.success('Imagem adicionada!')
      imgForm.resetFields()
      await loadProduct()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Erro ao adicionar imagem.')
    } finally {
      setImgLoading(false)
    }
  }

  // ===== OPTION GROUPS =====
  async function onAddGroup() {
    if (!isEdit || !id) return message.info('Salve o produto antes de adicionar opções.')

    try {
      const v = await groupForm.validateFields()
      setGroupLoading(true)

      await addOptionGroup(id, {
        name: v.name,
        required: v.required ?? false,
        minSelect: v.minSelect ?? 0,
        maxSelect: v.maxSelect ?? 1,
        sortOrder: v.sortOrder ?? 0,
      })

      message.success('Grupo criado!')
      groupForm.resetFields()
      await loadProduct()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Erro ao criar grupo.')
    } finally {
      setGroupLoading(false)
    }
  }

  // ===== OPTIONS =====
  async function onAddOption() {
    if (!isEdit || !id) return message.info('Salve o produto antes de adicionar opções.')
    if (!optionTargetGroupId) return message.error('Selecione um grupo para adicionar opção.')

    try {
      const v = await optionForm.validateFields()
      setOptionLoading(true)

      await addOption(optionTargetGroupId, {
        name: v.name,
        active: v.active ?? true,
        sortOrder: v.sortOrder ?? 0,
        modifierType: v.modifierType,
        modifierValue: Number(v.modifierValue || 0),
      })

      message.success('Opção adicionada!')
      optionForm.resetFields()
      setOptionTargetGroupId(null)
      await loadProduct()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.message || 'Erro ao adicionar opção.')
    } finally {
      setOptionLoading(false)
    }
  }

  const images = product?.images || []
  const optionGroups = product?.optionGroups || []

  const optionsColumns = useMemo(
    () => [
      {
        title: 'Opção',
        dataIndex: 'name',
        key: 'name',
        width: 260,
        render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
      },
      {
        title: 'Tipo',
        dataIndex: 'modifierType',
        key: 'modifierType',
        width: 170,
        responsive: ['md'],
        render: (v) => <Tag>{v}</Tag>,
      },
      {
        title: 'Valor',
        dataIndex: 'modifierValue',
        key: 'modifierValue',
        width: 140,
        render: (v) => v ?? 0,
      },
      {
        title: 'Ativo',
        dataIndex: 'active',
        key: 'active',
        width: 110,
        responsive: ['md'],
        render: (v) => (v ? <Tag color="green">Sim</Tag> : <Tag>Não</Tag>),
      },
      {
        title: 'Ordem',
        dataIndex: 'sortOrder',
        key: 'sortOrder',
        width: 100,
        responsive: ['lg'],
      },
    ],
    [],
  )

  return (
    <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
      {/* Header */}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} md={14}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/catalog/products')}>
              Voltar
            </Button>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {isEdit ? 'Editar Produto' : 'Novo Produto'}
              </Title>
              <Text type="secondary">Regras de preço, dimensões, estoque, imagens e opções.</Text>
            </div>
          </Space>
        </Col>

        <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={onSave}>
            Salvar
          </Button>
        </Col>
      </Row>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ active: true, pricingModel: 'AREA_M2', dimensionUnit: 'CM' }}
      >
        <Tabs defaultActiveKey="data">
          {/* DADOS */}
          <Tabs.TabPane tab="Dados" key="data">
            <Card style={{ borderRadius: 16 }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
                    <Input
                      onChange={(e) => {
                        const name = e.target.value
                        if (!slugTouched) form.setFieldValue('slug', slugify(name))
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
                    <Input
                      onChange={() => setSlugTouched(true)}
                      onBlur={() => setSlugTouched(true)}
                    />
                  </Form.Item>

                  <Button
                    size="small"
                    onClick={() => {
                      const name = form.getFieldValue('name') || ''
                      form.setFieldValue('slug', slugify(name))
                      setSlugTouched(false)
                    }}
                  >
                    Regenerar slug
                  </Button>
                </Col>

                <Col xs={24}>
                  <Form.Item name="description" label="Descrição">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="categoryId" label="Categoria">
                    <Select allowClear options={categoryOptions} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item name="active" label="Ativo" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Tabs.TabPane>

          {/* PREÇO */}
          <Tabs.TabPane tab="Precificação" key="price">
            <Card style={{ borderRadius: 16 }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={8}>
                  <Form.Item name="pricingModel" label="Modelo" rules={[{ required: true }]}>
                    <Select options={PRICING_MODEL_OPTIONS} />
                  </Form.Item>
                </Col>

                {pricingModel === 'UNIT' && (
                  <Col xs={24} md={8}>
                    <Form.Item name="baseUnitPriceCents" label="Preço unitário (centavos)">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                )}

                {pricingModel === 'AREA_M2' && (
                  <Col xs={24} md={8}>
                    <Form.Item name="baseM2PriceCents" label="Preço por m² (centavos)">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                )}

                {pricingModel === 'LINEAR_M' && (
                  <Col xs={24} md={8}>
                    <Form.Item name="baseLinearMPriceCents" label="Preço por metro (centavos)">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24} md={8}>
                  <Form.Item name="minPriceCents" label="Preço mínimo (centavos)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="minAreaM2" label="Área mínima (m²)">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Tabs.TabPane>

          {/* DIMENSÕES */}
          <Tabs.TabPane tab="Dimensões" key="dims">
            <Card style={{ borderRadius: 16 }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={6}>
                  <Form.Item name="dimensionUnit" label="Unidade" rules={[{ required: true }]}>
                    <Select options={DIMENSION_UNIT_OPTIONS} />
                  </Form.Item>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Item name="minWidth" label="Largura mínima">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Item name="maxWidth" label="Largura máxima">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Item name="minHeight" label="Altura mínima">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Item name="maxHeight" label="Altura máxima">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Item name="step" label="Incremento (step)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Tabs.TabPane>

          {/* ESTOQUE */}
          <Tabs.TabPane tab="Estoque" key="stock">
            <Card style={{ borderRadius: 16 }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={6}>
                  <Form.Item name="stockQuantity" label="Quantidade em estoque">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Tabs.TabPane>

          {/* IMAGENS */}
          <Tabs.TabPane tab="Imagens" key="images">
            <Card style={{ borderRadius: 16 }}>
              {!isEdit ? (
                <Text type="secondary">Salve o produto antes de adicionar imagens.</Text>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  {/* Upload + Alt */}
                  <Card style={{ borderRadius: 14, border: '1px solid #E6ECE9' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size={10}>
                      <Text strong>Upload de imagem</Text>

                      <Form form={imgForm} layout="vertical" requiredMark={false}>
                        <Row gutter={[12, 12]} align="middle">
                          <Col xs={24} md={10}>
                            <Form.Item name="alt" label="Alt (opcional)">
                              <Input placeholder="Descrição da imagem" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={14}>
                            <Form.Item label="Arquivo">
                              <Upload
                                accept="image/*"
                                maxCount={1}
                                showUploadList={false}
                                customRequest={handleUploadRequest}
                                onChange={async (info) => {
                                  if (info.file.status === 'done') {
                                    const alt = imgForm.getFieldValue('alt') || null

                                    // garante que tem url
                                    const res = info.file.response
                                    const url = res?.url

                                    if (!url) {
                                      console.log('Resposta do upload inválida:', res)
                                      message.error('Upload retornou resposta inválida (sem url).')
                                      return
                                    }

                                    try {
                                      await onUploadedBindToProduct({ url }, alt)
                                      imgForm.resetFields(['alt'])
                                    } catch (e) {
                                      console.log(
                                        'Bind error:',
                                        e?.response?.status,
                                        e?.response?.data,
                                      )
                                      message.error(
                                        e?.response?.data?.message ||
                                          'Erro ao vincular imagem ao produto.',
                                      )
                                    }
                                  }

                                  if (info.file.status === 'error') {
                                    message.error('Erro no upload da imagem.')
                                  }
                                }}
                              >
                                <Button icon={<UploadOutlined />} loading={uploading}>
                                  Enviar imagem
                                </Button>
                              </Upload>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Form>

                      <Text type="secondary">
                        Endpoint: <code>POST /admin/uploads/product-image</code> (multipart: file) →
                        salva e retorna <code>{`{ url }`}</code>. Depois vinculamos no produto via{' '}
                        <code>POST /admin/products/:id/images</code>.
                      </Text>
                    </Space>
                  </Card>

                  <Divider style={{ margin: '8px 0' }} />

                  {/* Lista */}
                  {images.length === 0 ? (
                    <Empty description="Nenhuma imagem cadastrada" />
                  ) : (
                    <Row gutter={[12, 12]}>
                      {images.map((img) => {
                        const src = toAbsoluteUrl(img.url)
                        console.log('Imagem src:', src)
                        return (
                          <Col key={img.id} xs={24} sm={12} lg={8}>
                            <Card
                              hoverable
                              style={{ borderRadius: 14, overflow: 'hidden' }}
                              cover={
                                <div
                                  style={{ height: 160, overflow: 'hidden', background: '#f5f5f5' }}
                                >
                                  <Image
                                    src={src}
                                    alt={img.alt || ''}
                                    width="100%"
                                    height={160}
                                    style={{ objectFit: 'cover' }}
                                    preview
                                  />
                                </div>
                              }
                              actions={[
                                <Button
                                  key="open"
                                  type="link"
                                  onClick={() => window.open(src, '_blank', 'noreferrer')}
                                >
                                  Abrir
                                </Button>,
                                <Button key="remove" type="link" disabled>
                                  Remover
                                </Button>,
                              ]}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {img.alt || 'Imagem'}
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
                                {img.url}
                              </div>
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                  )}

                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    Para remover, recomendo criar:{' '}
                    <code>DELETE /admin/products/:productId/images/:imageId</code>.
                  </Text>
                </Space>
              )}
            </Card>
          </Tabs.TabPane>

          {/* OPÇÕES */}
          <Tabs.TabPane tab="Opções" key="options">
            <Card style={{ borderRadius: 16 }}>
              {!isEdit ? (
                <Text type="secondary">Salve o produto antes de adicionar grupos e opções.</Text>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {/* Criar grupo */}
                  <Card style={{ borderRadius: 14, border: '1px solid #E6ECE9' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>Criar grupo de opções</Text>

                      <Form form={groupForm} layout="vertical" requiredMark={false}>
                        <Row gutter={[12, 12]}>
                          <Col xs={24} md={10}>
                            <Form.Item
                              name="name"
                              label="Nome do grupo"
                              rules={[{ required: true }]}
                            >
                              <Input placeholder="Ex.: Acabamento" />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Item name="required" label="Obrigatório" valuePropName="checked">
                              <Switch />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={3}>
                            <Form.Item name="minSelect" label="Min" initialValue={0}>
                              <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={3}>
                            <Form.Item name="maxSelect" label="Max" initialValue={1}>
                              <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Item name="sortOrder" label="Ordem" initialValue={0}>
                              <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={24}>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              loading={groupLoading}
                              onClick={onAddGroup}
                            >
                              Criar grupo
                            </Button>
                          </Col>
                        </Row>
                      </Form>

                      <Text type="secondary">
                        Dica: se “Obrigatório” estiver ligado, coloque Min ≥ 1.
                      </Text>
                    </Space>
                  </Card>

                  {/* Adicionar opção em grupo */}
                  <Card style={{ borderRadius: 14, border: '1px solid #E6ECE9' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text strong>Adicionar opção em um grupo</Text>

                      <Form form={optionForm} layout="vertical" requiredMark={false}>
                        <Row gutter={[12, 12]}>
                          <Col xs={24} md={8}>
                            <Form.Item label="Grupo" required>
                              <Select
                                value={optionTargetGroupId}
                                onChange={setOptionTargetGroupId}
                                placeholder="Selecione um grupo"
                                options={optionGroups.map((g) => ({ label: g.name, value: g.id }))}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={8}>
                            <Form.Item
                              name="name"
                              label="Nome da opção"
                              rules={[{ required: true }]}
                            >
                              <Input placeholder="Ex.: Brilho" />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Item
                              name="modifierType"
                              label="Tipo"
                              rules={[{ required: true }]}
                              initialValue="FIXED_CENTS"
                            >
                              <Select options={MODIFIER_TYPE_OPTIONS} />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Item name="modifierValue" label="Valor" initialValue={0}>
                              <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Item name="sortOrder" label="Ordem" initialValue={0}>
                              <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                          </Col>

                          <Col xs={12} md={4}>
                            <Form.Item
                              name="active"
                              label="Ativo"
                              valuePropName="checked"
                              initialValue={true}
                            >
                              <Switch />
                            </Form.Item>
                          </Col>

                          <Col xs={24}>
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              loading={optionLoading}
                              onClick={onAddOption}
                            >
                              Adicionar opção
                            </Button>
                          </Col>
                        </Row>
                      </Form>
                    </Space>
                  </Card>

                  {/* Lista de grupos + opções */}
                  {optionGroups.length === 0 ? (
                    <Empty description="Nenhum grupo de opções cadastrado" />
                  ) : (
                    <Collapse accordion>
                      {optionGroups.map((g) => (
                        <Collapse.Panel
                          header={
                            <Space wrap>
                              <Text strong>{g.name}</Text>
                              {g.required ? (
                                <Tag color="green">Obrigatório</Tag>
                              ) : (
                                <Tag>Opcional</Tag>
                              )}
                              <Tag>Min {g.minSelect}</Tag>
                              <Tag>Max {g.maxSelect}</Tag>
                              <Tag>Ordem {g.sortOrder}</Tag>
                            </Space>
                          }
                          key={g.id}
                        >
                          {(g.options || []).length === 0 ? (
                            <Empty description="Sem opções neste grupo" />
                          ) : (
                            <Table
                              rowKey="id"
                              columns={optionsColumns}
                              dataSource={g.options || []}
                              pagination={false}
                              scroll={{ x: 'max-content' }}
                            />
                          )}

                          <Text type="secondary" style={{ display: 'block', marginTop: 10 }}>
                            Para editar/remover grupos/opções, vamos criar rotas PATCH/DELETE
                            (próximo passo).
                          </Text>
                        </Collapse.Panel>
                      ))}
                    </Collapse>
                  )}
                </Space>
              )}
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Form>
    </div>
  )
}
