const Stub = ({ title, emoji = '🚧' }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
            <div className="text-6xl">{emoji}</div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-gray-400">Coming soon!</p>
            <a href="/" className="btn-primary inline-block">← Back</a>
        </div>
    </div>
)

export const Dashboard = () => <Stub title="Management Dashboard" emoji="🛠️" />
export const Users = () => <Stub title="User Management" emoji="👥" />
export const Orders = () => <Stub title="All Orders" emoji="📋" />
export const Analytics = () => <Stub title="Platform Analytics" emoji="📊" />
export const SealAudit = () => <Stub title="Seal Audit Panel" emoji="🔒" />
export const Disputes = () => <Stub title="Dispute Resolution" emoji="⚖️" />
export const Promotions = () => <Stub title="Promotions" emoji="🎟️" />
