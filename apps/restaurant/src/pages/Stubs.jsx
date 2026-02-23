// Restaurant Stubs
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
export const Orders = () => <Stub title="All Orders" emoji="📋" />
export const OrderDetail = () => <Stub title="Order Details" emoji="📦" />
export const Menu = () => <Stub title="Menu Management" emoji="📃" />
export const Analytics = () => <Stub title="Analytics" emoji="📊" />
export const Profile = () => <Stub title="Restaurant Profile" emoji="🏪" />
