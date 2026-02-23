/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { Layout, Menu, Button, Typography, Badge, Avatar } from 'antd'
import {
  HomeOutlined,
  TeamOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useAuth } from '@/store/auth/AuthContext'
import '../../shared/styles/responsive.css'

dayjs.locale('pt-br')

const { Header, Sider, Content } = Layout
const { Text } = Typography

function useSelectedKey() {
  const { pathname } = useLocation()

  if (pathname.startsWith('/customers')) return 'customers'
  if (pathname.startsWith('/catalog')) return 'catalog'
  if (pathname.startsWith('/quotes')) return 'quotes'
  if (pathname.startsWith('/orders')) return 'orders'
  if (pathname.startsWith('/visual-chat')) return 'visual-chat'

  // Admin dropdown
  if (pathname.startsWith('/admin/users')) return 'admin-users'
  if (pathname.startsWith('/admin/groups')) return 'admin-groups'
  if (pathname.startsWith('/admin/permissions')) return 'admin-permissions'
  if (pathname.startsWith('/admin')) return 'admin'

  return 'dashboard'
}

export default function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const selected = useSelectedKey()
  const { user, logout, isAdmin } = useAuth()

  const [collapsed, setCollapsed] = useState(false)
  const [now, setNow] = useState(() => dayjs())

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(t)
  }, [])

  // ✅ abre submenu admin quando estiver em /admin/*
  const [openKeys, setOpenKeys] = useState(() => {
    return pathname.startsWith('/admin') ? ['admin'] : []
  })

  useEffect(() => {
    // se entrar em /admin/*, garante o submenu aberto
    if (pathname.startsWith('/admin')) {
      setOpenKeys((prev) => (prev.includes('admin') ? prev : ['admin']))
    }
  }, [pathname])

  const menuItems = useMemo(() => {
    const base = [
      {
        key: 'dashboard',
        icon: <HomeOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/'),
      },
      {
        key: 'customers',
        icon: <TeamOutlined />,
        label: 'Clientes',
        onClick: () => navigate('/customers'),
      },
      {
        key: 'catalog',
        icon: <ShoppingOutlined />,
        label: 'Catálogo',
        onClick: () => navigate('/catalog/products'),
      },
      {
        key: 'quotes',
        icon: <FileTextOutlined />,
        label: 'Orçamentos',
        onClick: () => navigate('/quotes'),
      },
      {
        key: 'visual-chat',
        icon: <WhatsAppOutlined />,
        label: 'Visual Chat',
        onClick: () => navigate('/visual-chat'),
      },
    ]

    if (isAdmin) {
      base.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: 'Admin',
        children: [
          {
            key: 'admin-users',
            icon: <UserOutlined />,
            label: 'Usuários',
            onClick: () => navigate('/admin/users'),
          },
          {
            key: 'admin-groups',
            icon: <TeamOutlined />,
            label: 'Grupos',
            onClick: () => navigate('/admin/groups'),
          },
          {
            key: 'admin-permissions',
            icon: <SettingOutlined />,
            label: 'Permissões',
            onClick: () => navigate('/admin/permissions'),
          },
        ],
      })
    }

    return base
  }, [navigate, isAdmin])

  const pageTitle = useMemo(() => {
    if (selected === 'dashboard') return 'Dashboard'
    if (selected === 'customers') return 'Clientes'
    if (selected === 'catalog') return 'Catálogo'
    if (selected === 'quotes') return 'Orçamentos'
    if (selected === 'orders') return 'Orçamentos e Pedidos'
    if (selected === 'admin' || selected.startsWith('admin-')) return 'Admin'
    if (selected === 'visual-chat') return 'Visual Chat'
    return 'ERP'
  }, [selected])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ✅ SIDEBAR COM GRADIENTE */}
      <Sider
        width={240}
        theme="dark"
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={{
          background: 'linear-gradient(180deg, #0F3D2E 0%, #066C47 60%, #00A859 100%)',
          padding: '16px 12px',
          boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* TOPO: LOGO */}
        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '8px 8px',
            marginBottom: 12,
            gap: 12,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: 0.2,
              userSelect: 'none',
            }}
          >
            <img src="/logo-web.svg" style={{ maxWidth: '45px' }} alt="Visual Art Logo" />
          </div>

          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 800, color: '#fff' }}>Visual Art</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>ERP</span>
            </div>
          )}
        </div>

        {/* MENU */}
        <Menu
          className="va-sider-menu"
          mode="inline"
          selectedKeys={[selected]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={menuItems}
          theme="dark"
          inlineIndent={18}
          style={{
            borderRight: 0,
            background: 'transparent',
            paddingTop: 6,
          }}
        />

        {/* RODAPÉ DO SIDER */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 12,
          }}
        >
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              {!collapsed && (
                <div style={{ lineHeight: 1.1 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>
                    {user?.name || 'Usuário'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
                    {user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <Button
                size="small"
                onClick={logout}
                icon={<LogoutOutlined />}
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#fff',
                }}
              >
                Sair
              </Button>
            )}
          </div>
        </div>
      </Sider>

      <Layout>
        {/* HEADER BAR */}
        <Header
          style={{
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            borderBottom: '1px solid #DCE9E3',
            borderTop: '4px solid #00A859',
            background: '#fff',
          }}
        >
          {/* LADO ESQUERDO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((v) => !v)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 600 }}>{pageTitle}</span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                {now.format('dddd, DD [de] MMMM [de] YYYY')}
              </span>
            </div>
          </div>

          {/* LADO DIREITO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Badge count={2} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>

            <div style={{ width: 1, height: 28, background: '#E6ECE9' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 500 }}>{user?.name}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                </div>
              </div>

              <Button
                type="text"
                icon={<UserOutlined />}
                onClick={() => navigate('/admin/profile')}
              />
              <Button type="text" icon={<LogoutOutlined />} onClick={logout} />
            </div>
          </div>
        </Header>

        {/* CONTENT */}
        <Content style={{ padding: 16 }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #DCE9E3',
              borderRadius: 16,
              padding: 16,
              minHeight: 'calc(100vh - 64px - 32px)',
              boxShadow: '0 10px 28px rgba(6,108,71,0.06)',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
