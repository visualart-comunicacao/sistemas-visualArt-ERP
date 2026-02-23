import React, { useMemo, useState } from 'react'
import {
  Button,
  Table,
  Typography,
  Space,
  Tag,
  Switch,
  Input,
  Tooltip,
  Divider,
  Descriptions,
  Badge,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

// ✅ MOCK: padrão para plugar API depois
const MOCK_USERS = [
  {
    id: 117,
    name: 'Alex Borelli',
    username: 'Alex Borelli',
    group: 'ATENDIMENTO E VENDAS',
    salesGoal: 0,
    bonusPct: 0,
    active: true,
    email: 'alex.devacc@outlook.com',
    permissions: {
      gerenteComercial: false,
      visualizarMarkup: false,
      master: true,
      visualizarTodosClientes: true,
      todosOrcamentos: true,
      todasOS: true,
      cardsFunil: true,
      todosAtendimentos: true,
    },
    sales: {
      tables: null,
    },
  },
  {
    id: 116,
    name: 'Anny Carvalho',
    username: 'Anny Carvalho',
    group: 'ATENDIMENTO E VENDAS',
    salesGoal: 0,
    bonusPct: 0,
    active: true,
    email: 'anny@visualart.com',
    permissions: {
      gerenteComercial: false,
      visualizarMarkup: true,
      master: false,
      visualizarTodosClientes: false,
      todosOrcamentos: false,
      todasOS: true,
      cardsFunil: true,
      todosAtendimentos: true,
    },
    sales: { tables: 'Tabela A' },
  },
  {
    id: 114,
    name: 'Beatriz Carvalho',
    username: 'Beatriz Carvalho',
    group: 'ATENDIMENTO E VENDAS',
    salesGoal: 3500,
    bonusPct: 1.5,
    active: false,
    email: 'bia@visualart.com',
    permissions: {
      gerenteComercial: false,
      visualizarMarkup: false,
      master: false,
      visualizarTodosClientes: false,
      todosOrcamentos: true,
      todasOS: false,
      cardsFunil: false,
      todosAtendimentos: true,
    },
    sales: { tables: 'Tabela B' },
  },
]

function moneyBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value || 0),
  )
}

function pctBR(value) {
  const v = Number(value || 0)
  return `${v.toFixed(2).replace('.', ',')} %`
}

function YesNo({ value }) {
  return value ? <Tag color="green">Sim</Tag> : <Tag color="red">Não</Tag>
}

export default function UsersPage() {
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [expandedRowKeys, setExpandedRowKeys] = useState([])

  const data = useMemo(() => {
    const q = query.trim().toLowerCase()

    return MOCK_USERS.filter((u) => (showInactive ? true : u.active))
      .filter((u) => {
        if (!q) return true
        return (
          String(u.id).includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.group.toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
        )
      })
      .map((u) => ({ key: u.id, ...u }))
  }, [query, showInactive])

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Nome',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.active ? 'Ativo' : 'Inativo'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Usuário',
      dataIndex: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Grupo',
      dataIndex: 'group',
      sorter: (a, b) => a.group.localeCompare(b.group),
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: 'Meta de venda',
      dataIndex: 'salesGoal',
      align: 'right',
      sorter: (a, b) => (a.salesGoal || 0) - (b.salesGoal || 0),
      render: (v) => moneyBRL(v),
    },
    {
      title: 'Bônus',
      dataIndex: 'bonusPct',
      align: 'right',
      sorter: (a, b) => (a.bonusPct || 0) - (b.bonusPct || 0),
      render: (v) => pctBR(v),
    },
    {
      title: '',
      key: 'actions',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation() // 👈 impede expandir
                console.log('edit', record.id)
              }}
            />
          </Tooltip>

          <Tooltip title="Excluir">
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation() // 👈 impede expandir
                console.log('edit', record.id)
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* HEADER DA PÁGINA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Usuários
          </Title>
          <Text type="secondary">Gerencie usuários, permissões e metas.</Text>
        </div>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => console.log('add')}>
            Adicionar
          </Button>
        </Space>
      </div>

      {/* BARRA DE AÇÕES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Input
          allowClear
          placeholder="Buscar por ID, nome, usuário, grupo ou email..."
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 520 }}
        />

        <Space>
          <Text type="secondary">Exibir Inativos</Text>
          <Switch checked={showInactive} onChange={setShowInactive} />
        </Space>
      </div>

      {/* TABELA */}
      <Table
        bordered={false}
        columns={columns}
        dataSource={data}
        size="small"
        pagination={{ pageSize: 8 }}
        rowKey="id"
        style={{
          cursor: 'pointer',
        }}
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
              {/* INFORMAÇÕES GERAIS */}
              <Title level={5} style={{ marginTop: 0 }}>
                Informações Gerais
              </Title>

              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2, md: 4 }}
                labelStyle={{ opacity: 0.75 }}
              >
                <Descriptions.Item label="Nome usual">{record.name}</Descriptions.Item>
                <Descriptions.Item label="Usuário">{record.username}</Descriptions.Item>
                <Descriptions.Item label="Grupo">{record.group}</Descriptions.Item>
                <Descriptions.Item label="Email">{record.email || '-'}</Descriptions.Item>
              </Descriptions>

              <Divider />

              {/* PERMISSÕES */}
              <Title level={5} style={{ marginTop: 0 }}>
                Permissões
              </Title>

              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2, md: 4 }}
                labelStyle={{ opacity: 0.75 }}
              >
                <Descriptions.Item label="Gerente comercial">
                  <YesNo value={record.permissions?.gerenteComercial} />
                </Descriptions.Item>

                <Descriptions.Item label="Visualizar Mark-up">
                  <YesNo value={record.permissions?.visualizarMarkup} />
                </Descriptions.Item>

                <Descriptions.Item label="Master">
                  {record.permissions?.master ? (
                    <Badge status="success" text="Sim" />
                  ) : (
                    <Badge status="default" text="Não" />
                  )}
                </Descriptions.Item>

                <Descriptions.Item label="Visualizar todos os clientes">
                  <YesNo value={record.permissions?.visualizarTodosClientes} />
                </Descriptions.Item>

                <Descriptions.Item label="Todos os orçamentos">
                  <YesNo value={record.permissions?.todosOrcamentos} />
                </Descriptions.Item>

                <Descriptions.Item label="Todas as O.S.">
                  <YesNo value={record.permissions?.todasOS} />
                </Descriptions.Item>

                <Descriptions.Item label="Todos os cards do funil">
                  <YesNo value={record.permissions?.cardsFunil} />
                </Descriptions.Item>

                <Descriptions.Item label="Todos os atendimentos">
                  <YesNo value={record.permissions?.todosAtendimentos} />
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              {/* VENDAS */}
              <Title level={5} style={{ marginTop: 0 }}>
                Vendas
              </Title>

              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2, md: 4 }}
                labelStyle={{ opacity: 0.75 }}
              >
                <Descriptions.Item label="Tabelas">
                  {record.sales?.tables || <Text type="secondary">Não selecionado</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Meta de venda">
                  {moneyBRL(record.salesGoal)}
                </Descriptions.Item>
                <Descriptions.Item label="Bônus">{pctBR(record.bonusPct)}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  {record.active ? <Tag color="green">Ativo</Tag> : <Tag color="red">Inativo</Tag>}
                </Descriptions.Item>
              </Descriptions>
            </div>
          ),
        }}
      />
    </div>
  )
}
