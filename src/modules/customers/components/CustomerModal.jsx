import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Segmented,
  Space,
  Switch,
  Tabs,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { createCustomer, getCustomer, updateCustomer } from '@/api/customers.api'

const { Text } = Typography

const CUSTOMER_TYPES = [
  { label: 'Pessoa (PF)', value: 'PERSON' },
  { label: 'Empresa (PJ)', value: 'BUSINESS' },
]

const GENDER_OPTIONS = [
  { label: 'Não informar', value: 'NOT_INFORMED' },
  { label: 'Masculino', value: 'MALE' },
  { label: 'Feminino', value: 'FEMALE' },
  { label: 'Outro', value: 'OTHER' },
]

function onlyDigits(v = '') {
  return String(v).replace(/\D/g, '')
}
function maskCep(v = '') {
  const d = onlyDigits(v).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}
function maskCpf(v = '') {
  const d = onlyDigits(v).slice(0, 11)
  const p1 = d.slice(0, 3)
  const p2 = d.slice(3, 6)
  const p3 = d.slice(6, 9)
  const p4 = d.slice(9, 11)
  if (d.length <= 3) return p1
  if (d.length <= 6) return `${p1}.${p2}`
  if (d.length <= 9) return `${p1}.${p2}.${p3}`
  return `${p1}.${p2}.${p3}-${p4}`
}
function maskCnpj(v = '') {
  const d = onlyDigits(v).slice(0, 14)
  const p1 = d.slice(0, 2)
  const p2 = d.slice(2, 5)
  const p3 = d.slice(5, 8)
  const p4 = d.slice(8, 12)
  const p5 = d.slice(12, 14)
  if (d.length <= 2) return p1
  if (d.length <= 5) return `${p1}.${p2}`
  if (d.length <= 8) return `${p1}.${p2}.${p3}`
  if (d.length <= 12) return `${p1}.${p2}.${p3}/${p4}`
  return `${p1}.${p2}.${p3}/${p4}-${p5}`
}

function extractApiMsg(err) {
  // prioriza mensagens do backend
  const m = err?.response?.data?.message || err?.response?.data?.error
  if (m) return m
  // fallback
  if (err?.response?.status === 409)
    return 'Já existe um cliente com esses dados (email/documento/CPF/CNPJ).'
  return 'Erro ao salvar cliente.'
}

export default function CustomerModal({ open, mode, customerId, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const isEdit = mode === 'edit'

  const title = useMemo(() => (isEdit ? 'Editar cliente' : 'Novo cliente'), [isEdit])

  useEffect(() => {
    if (!open) return

    async function load() {
      try {
        setLoading(true)

        if (isEdit && customerId) {
          const data = await getCustomer(customerId)

          // esperando retorno com include profile + addresses ou address
          const addr = (data?.addresses || []).find((a) => a.isDefault) || data?.address || null

          form.setFieldsValue({
            // raiz
            name: data?.name,
            phone: data?.phone,
            email: data?.email,
            document: data?.document,
            isActive: data?.isActive ?? true,

            // profile
            type: data?.profile?.type ?? data?.type ?? 'PERSON',

            // PF
            fullName: data?.profile?.fullName ?? data?.fullName,
            birthDate:
              data?.profile?.birthDate || data?.birthDate
                ? dayjs(data.profile?.birthDate || data.birthDate)
                : null,
            gender: data?.profile?.gender ?? data?.gender ?? 'NOT_INFORMED',
            cpf: data?.profile?.cpf ?? data?.cpf,
            rg: data?.profile?.rg ?? data?.rg,

            // PJ
            cnpj: data?.profile?.cnpj ?? data?.cnpj,
            companyName: data?.profile?.companyName ?? data?.companyName,
            tradeName: data?.profile?.tradeName ?? data?.tradeName,
            stateTaxId: data?.profile?.stateTaxId ?? data?.stateTaxId,
            municipalTaxId: data?.profile?.municipalTaxId ?? data?.municipalTaxId,

            // contato / lgpd / controle
            phone2: data?.profile?.phone2 ?? data?.phone2,
            whatsapp: data?.profile?.whatsapp ?? data?.whatsapp ?? true,
            marketingOptIn: data?.profile?.marketingOptIn ?? data?.marketingOptIn ?? false,
            notes: data?.profile?.notes ?? data?.notes,
            isBlocked: data?.profile?.isBlocked ?? data?.isBlocked ?? false,

            // address
            addressType: addr?.type ?? 'SHIPPING',
            addressLabel: addr?.label,
            addressRecipient: addr?.recipient,
            addressZipCode: addr?.zipCode ? maskCep(addr.zipCode) : null,
            addressStreet: addr?.street,
            addressNumber: addr?.number,
            addressComplement: addr?.complement,
            addressDistrict: addr?.district,
            addressCity: addr?.city,
            addressState: addr?.state,
            addressReference: addr?.reference,
          })
        } else {
          form.resetFields()
          form.setFieldsValue({
            isActive: true,
            type: 'PERSON',
            gender: 'NOT_INFORMED',
            whatsapp: true,
            marketingOptIn: false,
            isBlocked: false,
            addressType: 'SHIPPING',
          })
        }
      } catch (err) {
        message.error(err?.response?.data?.message || 'Erro ao carregar cliente.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, isEdit, customerId, form])

  async function handleSubmit() {
    try {
      const v = await form.validateFields()
      setLoading(true)

      // payload CHAPADO como sua API espera
      const payload = {
        name: v.name,
        phone: v.phone || null,
        email: v.email || null,
        document: v.document || null,
        isActive: v.isActive ?? true,

        type: v.type,

        // PF
        fullName: v.fullName || null,
        birthDate: v.birthDate ? v.birthDate.toISOString() : null,
        gender: v.gender || 'NOT_INFORMED',
        cpf: v.cpf ? onlyDigits(v.cpf) : null,
        rg: v.rg || null,

        // PJ
        cnpj: v.cnpj ? onlyDigits(v.cnpj) : null,
        companyName: v.companyName || null,
        tradeName: v.tradeName || null,
        stateTaxId: v.stateTaxId || null,
        municipalTaxId: v.municipalTaxId || null,

        // contato / lgpd / controle
        phone2: v.phone2 || null,
        whatsapp: !!v.whatsapp,
        marketingOptIn: !!v.marketingOptIn,
        notes: v.notes || null,
        isBlocked: !!v.isBlocked,

        address: v.addressZipCode
          ? {
              type: v.addressType || 'SHIPPING',
              isDefault: true,
              label: v.addressLabel || null,
              recipient: v.addressRecipient || null,
              zipCode: onlyDigits(v.addressZipCode),
              street: v.addressStreet,
              number: v.addressNumber,
              complement: v.addressComplement || null,
              district: v.addressDistrict,
              city: v.addressCity,
              state: v.addressState,
              reference: v.addressReference || null,
            }
          : undefined,
      }

      if (isEdit) {
        await updateCustomer(customerId, payload)
        message.success('Cliente atualizado!')
      } else {
        await createCustomer(payload)
        message.success('Cliente criado!')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      if (err?.errorFields) return
      message.error(extractApiMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onClose}
      width={980}
      destroyOnHidden
      mask={{
        closable: false,
      }}
      footer={
        <Space>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Salvar
          </Button>
        </Space>
      }
      styles={{ body: { maxHeight: '72vh', overflow: 'auto', paddingTop: 8 } }}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Tabs
          defaultActiveKey="base"
          items={[
            {
              key: 'base',
              label: 'Dados',
              children: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item
                    name="name"
                    label="Nome"
                    rules={[{ required: true, message: 'Informe o nome' }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="E-mail (opcional)"
                    rules={[{ type: 'email', message: 'E-mail inválido' }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item name="phone" label="Telefone (opcional)">
                    <Input />
                  </Form.Item>

                  <Form.Item name="document" label="Documento (opcional)">
                    <Input />
                  </Form.Item>

                  <Form.Item name="isActive" label="Ativo" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </div>
              ),
            },
            {
              key: 'profile',
              label: 'Perfil',
              children: (
                <div style={{ display: 'grid', gap: 12 }}>
                  <Form.Item name="type" label="Tipo">
                    <Segmented options={CUSTOMER_TYPES} />
                  </Form.Item>

                  <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
                    {({ getFieldValue }) => {
                      const t = getFieldValue('type')

                      if (t === 'BUSINESS') {
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Form.Item
                              name="companyName"
                              label="Razão social"
                              rules={[{ required: true, message: 'Informe a razão social' }]}
                            >
                              <Input />
                            </Form.Item>
                            <Form.Item name="tradeName" label="Nome fantasia">
                              <Input />
                            </Form.Item>

                            <Form.Item
                              name="cnpj"
                              label="CNPJ"
                              rules={[
                                { required: true, message: 'Informe o CNPJ' },
                                {
                                  validator: (_, val) => {
                                    const d = onlyDigits(val || '')
                                    if (!d) return Promise.resolve()
                                    return d.length === 14
                                      ? Promise.resolve()
                                      : Promise.reject(new Error('CNPJ inválido'))
                                  },
                                },
                              ]}
                            >
                              <Input
                                onChange={(e) =>
                                  form.setFieldValue('cnpj', maskCnpj(e.target.value))
                                }
                              />
                            </Form.Item>

                            <Form.Item name="stateTaxId" label="Inscrição Estadual (opcional)">
                              <Input />
                            </Form.Item>
                            <Form.Item name="municipalTaxId" label="Inscrição Municipal (opcional)">
                              <Input />
                            </Form.Item>
                          </div>
                        )
                      }

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Form.Item name="fullName" label="Nome completo (opcional)">
                            <Input />
                          </Form.Item>

                          <Form.Item
                            name="cpf"
                            label="CPF (opcional)"
                            rules={[
                              {
                                validator: (_, val) => {
                                  const d = onlyDigits(val || '')
                                  if (!d) return Promise.resolve()
                                  return d.length === 11
                                    ? Promise.resolve()
                                    : Promise.reject(new Error('CPF inválido'))
                                },
                              },
                            ]}
                          >
                            <Input
                              onChange={(e) => form.setFieldValue('cpf', maskCpf(e.target.value))}
                            />
                          </Form.Item>

                          <Form.Item name="rg" label="RG (opcional)">
                            <Input />
                          </Form.Item>

                          <Form.Item name="birthDate" label="Nascimento (opcional)">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                          </Form.Item>

                          <Form.Item name="gender" label="Gênero">
                            <Select options={GENDER_OPTIONS} />
                          </Form.Item>
                        </div>
                      )
                    }}
                  </Form.Item>

                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <Form.Item name="whatsapp" label="WhatsApp" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="isBlocked" label="Bloqueado" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name="marketingOptIn" label="Marketing" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </div>

                  <Form.Item name="phone2" label="Telefone 2 (opcional)">
                    <Input />
                  </Form.Item>

                  <Form.Item name="notes" label="Observações (opcional)">
                    <Input.TextArea rows={3} />
                  </Form.Item>

                  <Text type="secondary">PF/PJ são validados conforme o tipo escolhido.</Text>
                </div>
              ),
            },
            {
              key: 'address',
              label: 'Endereço',
              children: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item name="addressType" label="Tipo">
                    <Select
                      options={[
                        { label: 'Entrega (SHIPPING)', value: 'SHIPPING' },
                        { label: 'Cobrança (BILLING)', value: 'BILLING' },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item name="addressLabel" label="Etiqueta (opcional)">
                    <Input placeholder="Casa / Matriz..." />
                  </Form.Item>

                  <Form.Item name="addressRecipient" label="Destinatário (opcional)">
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="addressZipCode"
                    label="CEP (opcional)"
                    rules={[
                      {
                        validator: (_, val) => {
                          const d = onlyDigits(val || '')
                          if (!d) return Promise.resolve()
                          return d.length === 8
                            ? Promise.resolve()
                            : Promise.reject(new Error('CEP inválido'))
                        },
                      },
                    ]}
                  >
                    <Input
                      onChange={(e) =>
                        form.setFieldValue('addressZipCode', maskCep(e.target.value))
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name="addressStreet"
                    label="Rua"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: (_, val) => {
                          const hasCep = !!onlyDigits(getFieldValue('addressZipCode') || '')
                          if (!hasCep) return Promise.resolve()
                          return val
                            ? Promise.resolve()
                            : Promise.reject(new Error('Informe a rua'))
                        },
                      }),
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="addressNumber"
                    label="Número"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: (_, val) => {
                          const hasCep = !!onlyDigits(getFieldValue('addressZipCode') || '')
                          if (!hasCep) return Promise.resolve()
                          return val
                            ? Promise.resolve()
                            : Promise.reject(new Error('Informe o número'))
                        },
                      }),
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item name="addressComplement" label="Complemento (opcional)">
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="addressDistrict"
                    label="Bairro"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: (_, val) => {
                          const hasCep = !!onlyDigits(getFieldValue('addressZipCode') || '')
                          if (!hasCep) return Promise.resolve()
                          return val
                            ? Promise.resolve()
                            : Promise.reject(new Error('Informe o bairro'))
                        },
                      }),
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="addressCity"
                    label="Cidade"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: (_, val) => {
                          const hasCep = !!onlyDigits(getFieldValue('addressZipCode') || '')
                          if (!hasCep) return Promise.resolve()
                          return val
                            ? Promise.resolve()
                            : Promise.reject(new Error('Informe a cidade'))
                        },
                      }),
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="addressState"
                    label="UF"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator: (_, val) => {
                          const hasCep = !!onlyDigits(getFieldValue('addressZipCode') || '')
                          if (!hasCep) return Promise.resolve()
                          return val ? Promise.resolve() : Promise.reject(new Error('Informe UF'))
                        },
                      }),
                    ]}
                  >
                    <Input maxLength={2} placeholder="SP" />
                  </Form.Item>

                  <Form.Item
                    name="addressReference"
                    label="Referência (opcional)"
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <Input />
                  </Form.Item>

                  <Text type="secondary" style={{ gridColumn: '1 / -1' }}>
                    Se preencher CEP, o restante do endereço vira obrigatório.
                  </Text>
                </div>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  )
}
