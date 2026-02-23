export const antdTheme = {
  token: {
    // Marca (do seu logo)
    colorPrimary: '#00A859',
    colorInfo: '#00A859',
    colorSuccess: '#00A859',
    colorWarning: '#95C949',
    colorError: '#d9363e',

    // Clean
    colorBgBase: '#F6F8F7', // fundo geral levemente esverdeado
    colorTextBase: '#1F2937', // texto mais “clean” (cinza-azulado)
    colorBorder: '#E6ECE9',

    // UX
    borderRadius: 12,
    wireframe: false,

    // Tipografia (se você tiver Inter instalada, ótimo)
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },

  components: {
    Button: {
      colorPrimaryHover: '#066C47',
      colorPrimaryActive: '#055a3b',
      // deixa o primary mais “premium”
      primaryShadow: '0 10px 18px rgba(0, 168, 89, 0.18)',
    },

    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary: '0 10px 28px rgba(17, 24, 39, 0.06)',
    },

    Layout: {
      // Layout claro (clean)
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      bodyBg: '#F6F8F7',
    },

    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: 'rgba(0, 168, 89, 0.12)',
      itemSelectedColor: '#066C47',
      itemHoverBg: 'rgba(0, 168, 89, 0.08)',
      itemHoverColor: '#066C47',
    },

    Table: {
      headerBg: '#ffffff',
      headerColor: '#111827',
      rowHoverBg: 'rgba(0, 168, 89, 0.06)',
    },

    Input: {
      activeBorderColor: '#00A859',
      hoverBorderColor: '#00A859',
    },
  },
}
