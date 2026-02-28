import { useGroupOrderStore } from '../store/groupOrderStore'
import { Link } from 'react-router-dom'

export default function GroupOrderBanner() {
    const { activeGroupId, participantName } = useGroupOrderStore()

    if (!activeGroupId) return null

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-gradient-to-r from-brand-600 to-blue-600 rounded-2xl p-4 shadow-2xl shadow-blue-500/20 border border-white/20 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold text-sm tracking-wide">👥 Active Group Order</h3>
                    <p className="text-blue-100 text-xs">Ordering as <span className="font-bold">{participantName}</span></p>
                </div>
                <Link
                    to={`/group-order/${activeGroupId}`}
                    className="bg-white text-blue-600 text-xs font-bold px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                    View Cart ➔
                </Link>
            </div>
        </div>
    )
}
