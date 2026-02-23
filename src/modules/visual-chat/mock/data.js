export const PRESENCE_OPTIONS = [
  { value: 'AVAILABLE', label: 'Disponível', color: 'green' },
  { value: 'BUSY', label: 'Ocupado', color: 'red' },
  { value: 'AWAY', label: 'Ausente', color: 'orange' },
  { value: 'OFFLINE', label: 'Offline', color: 'default' },
]

export const mockUser = {
  id: 'u1',
  name: 'Alex Borelli',
  presence: 'AVAILABLE', // <- era "status" string
  avatarUrl: null,
}

export const mockContacts = [
  {
    id: 'c1',
    name: 'URIAS MARCOS - GRUPO STEEL',
    phone: '+55 (16) 99778-5661',
    tags: ['Padrão', 'ATENDIMENTO ALEX'],
    avatarUrl: null,

    // painel da direita (info)
    email: null,
    notes: 'Cliente recorrente',
  },
]

export const mockThreads = [
  {
    id: 't1',
    contactId: 'c1',
    title: 'URIAS MARCOS - GRUPO STEEL',
    lastMessage: 'URIAS: Ok',
    updatedAt: '12:29',
    unread: 1,
    queue: 'MEUS', // padroniza (MEUS/ESPERA/TODOS)

    // ações/topbar
    ticketCurrent: '#18223',
    ticketList: ['#18223', '#18224', '#18225'], // mock para trocar ticket
    assignedTo: 'Alex', // mock para transferir
  },
]

// Mensagens: suporte a text | image | audio | file
export const mockMessagesByThread = {
  t1: [
    {
      id: 'm1',
      threadId: 't1',
      author: 'me', // me | them | system
      type: 'text',
      text: 'Perfeito',
      at: '13/02/2026 12:00',
    },
    {
      id: 'm2',
      threadId: 't1',
      author: 'me',
      type: 'text',
      text: 'Ok',
      at: '13/02/2026 12:29',
    },
    {
      id: 'm3',
      threadId: 't1',
      author: 'me',
      type: 'text',
      text: 'Agradeço a atenção, vou passar para o Guilherme e damos prosseguimento',
      at: '13/02/2026 12:17',
    },

    // exemplo de imagem (balão de foto)
    {
      id: 'm4',
      threadId: 't1',
      author: 'me',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900',
      caption: 'Banner exemplo',
      at: '13/02/2026 12:35',
    },

    // exemplo de áudio
    {
      id: 'm5',
      threadId: 't1',
      author: 'me',
      type: 'audio',
      audioDuration: '0:09',
      at: '13/02/2026 13:11',
    },
  ],
}

// Mock de atendentes para “Transferir”
export const mockAgents = ['Alex', 'Guilherme', 'Ricardo']
