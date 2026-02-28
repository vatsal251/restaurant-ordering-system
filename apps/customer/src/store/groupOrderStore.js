import { create } from 'zustand'

export const useGroupOrderStore = create((set, get) => ({
    activeGroupId: null,
    participantName: '',
    items: [],
    status: 'inactive', // inactive, active, locked

    setGroupSession: (groupId, name, status) => set({
        activeGroupId: groupId,
        participantName: name,
        status: status || 'active'
    }),

    updateItems: (items) => set({ items }),
    updateStatus: (status) => set({ status }),

    clearSession: () => set({
        activeGroupId: null,
        participantName: '',
        items: [],
        status: 'inactive'
    })
}))
