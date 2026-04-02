import React, { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message as antdMessage,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SaveOutlined,
  KeyOutlined,
} from '@ant-design/icons'
import { http } from '../../../../api/http'

const { Title, Text } = Typography
const { Option } = Select

const USERS_BASE = '/admin/users'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  document: '',
  role: 'EMPLOYEE',
  isActive: true,
  employeeProfile: {
    role: 'EMPLOYEE',
    active: true,
    department: '',
    unit: '',
    code: '',
  },
}

function roleTag(role) {
  if (role === 'ADMIN') return <Tag color="gold">ADMIN</Tag>
  if (role === 'EMPLOYEE') return <Tag color="blue">FUNCIONÁRIO</Tag>
  return <Tag>{role || '-'}</Tag>
}

function employeeRoleTag(role) {
  if (role === 'ADMIN') return <Tag color="purple">ADMIN INTERNO</Tag>
  if (role === 'MANAGER') return <Tag color="cyan">GERENTE</Tag>
  return <Tag>COLABORADOR</Tag>
}

function normalizeNullable(v) {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s ? s : null
}

function mapApiUserToTable(user) {
  return {
    key: user.id,
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    document: user.document || '',
    role: user.role || 'EMPLOYEE',
    active: !!user.isActive,
    employeeRole: user.employeeProfile?.role || 'EMPLOYEE',
    department: user.employeeProfile?.department || '',
    unit: user.employeeProfile?.unit || '',
    code: user.employeeProfile?.code || '',
    employeeActive:
      typeof user.employeeProfile?.active === 'boolean' ? user.employeeProfile.active : true,
    createdAt: user.createdAt,
  }
}

function buildCreatePayload(values) {
  return {
    name: values.name,
    email: values.email,
    password: values.password,
    role: values.role,
    isActive: !!values.isActive,
    phone: normalizeNullable(values.phone),
    document: normalizeNullable(values.document),
    employeeProfile: {
      role: values.employeeProfile?.role || (values.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'),
      active:
        typeof values.employeeProfile?.active === 'boolean' ? values.employeeProfile.active : true,
      department: normalizeNullable(values.employeeProfile?.department),
      unit: normalizeNullable(values.employeeProfile?.unit),
      code: normalizeNullable(values.employeeProfile?.code),
    },
  }
}

function buildUpdatePayload(values) {
  return {
    name: values.name,
    email: values.email,
    role: values.role,
    isActive: !!values.isActive,
    phone: normalizeNullable(values.phone),
    document: normalizeNullable(values.document),
    employeeProfile: {
      role: values.employeeProfile?.role || (values.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE'),
      active:
        typeof values.employeeProfile?.active === 'boolean' ? values.employeeProfile.active : true,
      department: normalizeNullable(values.employeeProfile?.department),
      unit: normalizeNullable(values.employeeProfile?.unit),
      code: normalizeNullable(values.employeeProfile?.code),
    },
  }
}

/**
 * Ajuste aqui se seu auth estiver salvo em outro lugar.
 * Esta função tenta descobrir o usuário logado a partir do localStorage.
 */
function getCurrentUserRole() {
  try {
    const possibleKeys = ['auth', 'auth_user', 'user', 'session']

    for (const key of possibleKeys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue

      const parsed = JSON.parse(raw)

      if (parsed?.role) return parsed.role
      if (parsed?.user?.role) return parsed.user.role
    }

    return null
  } catch {
    return null
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [expandedRowKeys, setExpandedRowKeys] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const [form] = Form.useForm()

  const isEditing = !!editingUser
  const currentUserRole = getCurrentUserRole()
  const canResetPasswords = currentUserRole === 'ADMIN'

  async function loadUsers() {
    try {
      setLoading(true)

      const params = {}

      if (query.trim()) params.search = query.trim()
      if (roleFilter !== 'ALL') params.role = roleFilter
      if (!showInactive) params.isActive = true

      const { data } = await http.get(USERS_BASE, { params })
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []

      setUsers(list.map(mapApiUserToTable))
    } catch (err) {
      console.error(err)
      antdMessage.error('Não foi possível carregar os usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive, roleFilter])

  const data = useMemo(() => {
    const q = query.trim().toLowerCase()

    return users.filter((u) => {
      if (!q) return true

      return (
        String(u.id || '')
          .toLowerCase()
          .includes(q) ||
        String(u.name || '')
          .toLowerCase()
          .includes(q) ||
        String(u.email || '')
          .toLowerCase()
          .includes(q) ||
        String(u.phone || '')
          .toLowerCase()
          .includes(q) ||
        String(u.document || '')
          .toLowerCase()
          .includes(q) ||
        String(u.department || '')
          .toLowerCase()
          .includes(q) ||
        String(u.unit || '')
          .toLowerCase()
          .includes(q) ||
        String(u.code || '')
          .toLowerCase()
          .includes(q)
      )
    })
  }, [users, query])

  function openCreate() {
    setEditingUser(null)
    form.setFieldsValue(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(user) {
    setEditingUser(user)
    form.setFieldsValue({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      document: user.document || '',
      role: user.role || 'EMPLOYEE',
      isActive: !!user.active,
      employeeProfile: {
        role: user.employeeRole || 'EMPLOYEE',
        active: typeof user.employeeActive === 'boolean' ? user.employeeActive : true,
        department: user.department || '',
        unit: user.unit || '',
        code: user.code || '',
      },
    })
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
    setEditingUser(null)
    form.resetFields()
  }

  async function handleSubmit() {
    try {
      const values = await form.validateFields()

      setSaving(true)

      if (isEditing) {
        const payload = buildUpdatePayload(values)
        await http.put(`${USERS_BASE}/${editingUser.id}`, payload)
        antdMessage.success('Usuário atualizado com sucesso.')
      } else {
        if (!values.password) {
          antdMessage.error('Informe uma senha para o novo usuário.')
          return
        }

        if (values.password !== values.confirmPassword) {
          antdMessage.error('As senhas não conferem.')
          return
        }

        const payload = buildCreatePayload(values)
        await http.post(USERS_BASE, payload)
        antdMessage.success('Usuário criado com sucesso.')
      }

      closeModal()
      await loadUsers()
    } catch (err) {
      if (err?.errorFields) return

      console.error(err)
      const apiMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Não foi possível salvar o usuário.'

      antdMessage.error(apiMessage)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(record, checked) {
    try {
      await http.patch(`${USERS_BASE}/${record.id}/status`, {
        isActive: checked,
      })

      setUsers((prev) => prev.map((u) => (u.id === record.id ? { ...u, active: checked } : u)))

      antdMessage.success(`Usuário ${checked ? 'ativado' : 'desativado'} com sucesso.`)
    } catch (err) {
      console.error(err)
      antdMessage.error('Não foi possível alterar o status do usuário.')
    }
  }

  function handleDeactivate(record) {
    Modal.confirm({
      title: record.active ? 'Desativar usuário' : 'Ativar usuário',
      content: record.active
        ? `Deseja desativar "${record.name}"?`
        : `Deseja ativar "${record.name}"?`,
      okText: record.active ? 'Desativar' : 'Ativar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: record.active },
      onOk: async () => {
        await handleToggleActive(record, !record.active)
      },
    })
  }

  function handleResetPassword(record) {
    Modal.confirm({
      title: 'Resetar senha',
      content: (
        <div>
          <div>
            Deseja resetar a senha do usuário <strong>{record.name}</strong>?
          </div>
          <div style={{ marginTop: 8 }}>
            A nova senha será definida como <strong>123456</strong>.
          </div>
        </div>
      ),
      okText: 'Resetar senha',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await http.put(`${USERS_BASE}/${record.id}`, {
            password: '123456',
          })

          antdMessage.success(`Senha de "${record.name}" resetada para 123456.`)
        } catch (err) {
          console.error(err)
          const apiMessage =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            'Não foi possível resetar a senha.'

          antdMessage.error(apiMessage)
        }
      },
    })
  }

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Space size={6} wrap>
            {roleTag(record.role)}
            {employeeRoleTag(record.employeeRole)}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: (a, b) => String(a.email || '').localeCompare(String(b.email || '')),
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Setor',
      dataIndex: 'department',
      sorter: (a, b) => String(a.department || '').localeCompare(String(b.department || '')),
      render: (v) => (v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Unidade',
      dataIndex: 'unit',
      sorter: (a, b) => String(a.unit || '').localeCompare(String(b.unit || '')),
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Código',
      dataIndex: 'code',
      width: 120,
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'active',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.active ? <Tag color="green">Ativo</Tag> : <Tag color="red">Inativo</Tag>}
          <Switch
            size="small"
            checked={record.active}
            onClick={(checked, e) => {
              e?.stopPropagation?.()
              handleToggleActive(record, checked)
            }}
          />
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: canResetPasswords ? 190 : 120,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                openEdit(record)
              }}
            />
          </Tooltip>

          {canResetPasswords && (
            <Tooltip title="Resetar senha para 123456">
              <Button
                size="small"
                icon={<KeyOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleResetPassword(record)
                }}
              >
                Resetar
              </Button>
            </Tooltip>
          )}

          <Tooltip title={record.active ? 'Desativar' : 'Ativar'}>
            <Button
              size="small"
              danger={record.active}
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleDeactivate(record)
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Usuários
            </Title>
            <Text type="secondary">Gerencie usuários internos, perfis e permissões.</Text>
          </div>

          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Adicionar
            </Button>
          </Space>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Input
            allowClear
            placeholder="Buscar por nome, email, telefone, documento, setor, unidade..."
            prefix={<SearchOutlined />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={loadUsers}
            style={{ maxWidth: 520 }}
          />

          <Space wrap>
            <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 180 }}>
              <Option value="ALL">Todos os perfis</Option>
              <Option value="ADMIN">Somente Admin</Option>
              <Option value="EMPLOYEE">Somente Funcionário</Option>
            </Select>

            <Space>
              <Text type="secondary">Exibir inativos</Text>
              <Switch checked={showInactive} onChange={setShowInactive} />
            </Space>

            <Button onClick={loadUsers}>Atualizar</Button>
          </Space>
        </div>

        <Table
          bordered={false}
          columns={columns}
          dataSource={data}
          loading={loading}
          size="small"
          pagination={{ pageSize: 8 }}
          rowKey="id"
          style={{ cursor: 'pointer' }}
          expandable={{
            expandedRowKeys,
            onExpandedRowsChange: setExpandedRowKeys,
            expandRowByClick: true,
            showExpandColumn: false,
            expandedRowRender: (record) => (
              <div
                style={{
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <Title level={5} style={{ marginTop: 0 }}>
                  Informações Gerais
                </Title>

                <Descriptions
                  size="small"
                  column={{ xs: 1, sm: 2, md: 4 }}
                  labelStyle={{ opacity: 0.75 }}
                >
                  <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
                  <Descriptions.Item label="Nome">{record.name}</Descriptions.Item>
                  <Descriptions.Item label="Email">{record.email || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Telefone">{record.phone || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Documento">{record.document || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Perfil">{roleTag(record.role)}</Descriptions.Item>
                  <Descriptions.Item label="Nível interno">
                    {employeeRoleTag(record.employeeRole)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    {record.active ? (
                      <Tag color="green">Ativo</Tag>
                    ) : (
                      <Tag color="red">Inativo</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>

                <Divider />

                <Title level={5} style={{ marginTop: 0 }}>
                  Perfil interno
                </Title>

                <Descriptions
                  size="small"
                  column={{ xs: 1, sm: 2, md: 4 }}
                  labelStyle={{ opacity: 0.75 }}
                >
                  <Descriptions.Item label="Setor">
                    {record.department || <Text type="secondary">—</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Unidade">
                    {record.unit || <Text type="secondary">—</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Código">
                    {record.code || <Text type="secondary">—</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Perfil interno ativo">
                    {record.employeeActive ? (
                      <Badge status="success" text="Sim" />
                    ) : (
                      <Badge status="default" text="Não" />
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ),
          }}
        />
      </div>

      <Modal
        title={isEditing ? 'Editar usuário' : 'Novo usuário'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={saving}
        width={980}
        destroyOnClose={false}
        okButtonProps={{
          icon: <SaveOutlined />,
        }}
      >
        <Form form={form} layout="vertical" initialValues={EMPTY_FORM}>
          <Title level={5}>Informações principais</Title>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <Form.Item
              label="Nome"
              name="name"
              rules={[{ required: true, message: 'Informe o nome.' }]}
            >
              <Input placeholder="Nome completo" />
            </Form.Item>

            <Form.Item
              label="E-mail"
              name="email"
              rules={[
                { required: true, message: 'Informe o e-mail.' },
                { type: 'email', message: 'Informe um e-mail válido.' },
              ]}
            >
              <Input placeholder="email@empresa.com" />
            </Form.Item>

            <Form.Item label="Telefone" name="phone">
              <Input placeholder="(00) 00000-0000" />
            </Form.Item>

            <Form.Item label="Documento" name="document">
              <Input placeholder="CPF ou outro documento" />
            </Form.Item>

            <Form.Item
              label="Perfil do sistema"
              name="role"
              rules={[{ required: true, message: 'Selecione o perfil.' }]}
            >
              <Select>
                <Option value="ADMIN">ADMIN</Option>
                <Option value="EMPLOYEE">EMPLOYEE</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Usuário ativo" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          {!isEditing && (
            <>
              <Divider />
              <Title level={5}>Acesso</Title>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 12,
                }}
              >
                <Form.Item
                  label="Senha"
                  name="password"
                  rules={[
                    { required: true, message: 'Informe a senha.' },
                    { min: 6, message: 'A senha deve ter no mínimo 6 caracteres.' },
                  ]}
                >
                  <Input.Password placeholder="Digite a senha" />
                </Form.Item>

                <Form.Item
                  label="Confirmar senha"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Confirme a senha.' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const pwd = getFieldValue('password')
                        if (!pwd || pwd === value) return Promise.resolve()
                        return Promise.reject(new Error('As senhas não conferem.'))
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirme a senha" />
                </Form.Item>
              </div>
            </>
          )}

          {isEditing && (
            <>
              <Divider />
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <Text type="secondary">
                  A senha não é alterada nesta tela. Use a ação <strong>Resetar</strong> na tabela
                  para redefinir a senha do usuário.
                </Text>
              </div>
            </>
          )}

          <Divider />

          <Title level={5}>Perfil interno</Title>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <Form.Item
              label="Nível interno"
              name={['employeeProfile', 'role']}
              rules={[{ required: true, message: 'Selecione o nível interno.' }]}
            >
              <Select>
                <Option value="EMPLOYEE">EMPLOYEE</Option>
                <Option value="MANAGER">MANAGER</Option>
                <Option value="ADMIN">ADMIN</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Perfil interno ativo"
              name={['employeeProfile', 'active']}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item label="Setor / Departamento" name={['employeeProfile', 'department']}>
              <Input placeholder="Ex.: Atendimento e Vendas" />
            </Form.Item>

            <Form.Item label="Unidade" name={['employeeProfile', 'unit']}>
              <Input placeholder="Ex.: Matriz" />
            </Form.Item>

            <Form.Item label="Código interno" name={['employeeProfile', 'code']}>
              <Input placeholder="Ex.: COL-001" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  )
}
