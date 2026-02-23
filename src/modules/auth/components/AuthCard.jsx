import React from 'react'
import { Card, Typography } from 'antd'
import { motion } from 'framer-motion'
import { getLogoUrl } from '@/shared/utils/branding'

const { Title, Text } = Typography

export default function AuthCard({ title, subtitle, children }) {
  const logoUrl = getLogoUrl()

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 14px 30px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.div
              initial={{ rotate: -2 }}
              animate={{ rotate: 2 }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, rgba(0,168,89,0.18), rgba(149,201,73,0.10))',
                border: '1px solid rgba(0,168,89,0.20)',
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{ width: 30, height: 30, objectFit: 'contain' }}
                />
              ) : (
                <span style={{ fontWeight: 900, color: '#066C47' }}>VA</span>
              )}
            </motion.div>

            <div style={{ lineHeight: 1.15 }}>
              <Title level={4} style={{ margin: 0 }}>
                {title}
              </Title>
              {subtitle ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {subtitle}
                </Text>
              ) : null}
            </div>
          </div>

          {children}

          <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
            Visual Art ERP • v0.1
          </Text>
        </div>
      </Card>
    </motion.div>
  )
}
