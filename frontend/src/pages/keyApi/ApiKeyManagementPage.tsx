import React, { useState, useEffect, useCallback, PropsWithChildren, Fragment, useMemo } from 'react';
import { ApiKey, UserType, APIScope } from '../../types/apiKey';
import * as apiKeyService from '../../services/apiKeyService';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { KeyRound, Copy, Check, AlertTriangle, Plus, Trash2, Edit, Power, PowerOff, MoreVertical, Server, Search, User, Zap, Shield } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Reusable Modal Component
interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
}

const Modal = ({ children, onClose, title, icon }: ModalProps) => (
    <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <motion.div
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="p-5 border-b border-gray-200 flex items-center gap-3">
                {icon && <div className="text-gray-400">{icon}</div>}
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </motion.div>
    </motion.div>
);

// Reusable Skeleton Loader for List Items
const SkeletonLoader: React.FC = () => (
    <li className="p-4 sm:px-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-3 w-40 bg-gray-200 rounded"></div>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-gray-200"></div><div className="h-4 w-28 bg-gray-200 rounded"></div></div>
            <div className="hidden sm:block"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></div>
            <div className="flex justify-end"><div className="h-8 w-8 bg-gray-200 rounded-full"></div></div>
        </div>
    </li>
);

const ApiKeyManagementPage: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalState, setModalState] = useState<'create' | 'edit' | 'new-key' | 'confirm-delete' | null>(null);
    const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
    const [keyName, setKeyName] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedScope, setSelectedScope] = useState<APIScope>(APIScope.ExternalSales);
    const [filter, setFilter] = useState("");
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedKeys, fetchedUsers] = await Promise.all([
                apiKeyService.getApiKeys(),
                apiKeyService.getAllUsers()
            ]);
            setKeys(fetchedKeys);
            setUsers(fetchedUsers);
            setError(null);
        } catch (err) {
            setError('Failed to fetch initial data.');
            toast.error('Failed to fetch initial data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData() }, [fetchData]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const userIdToAssign = selectedUserId ? parseInt(selectedUserId, 10) : null;
        const promise = apiKeyService.createApiKey(keyName, selectedScope, userIdToAssign).then(newKey => {
            setKeys(prev => [newKey, ...prev]);
            setSelectedKey(newKey);
            setModalState('new-key');
            setKeyName("");
            setSelectedUserId("");
            setSelectedScope(APIScope.ExternalSales);
        });
        toast.promise(promise, { loading: 'Creating key...', success: <b>Key created!</b>, error: <b>Could not create key.</b> });
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKey) return;
        const promise = apiKeyService.updateApiKeyName(selectedKey.id, selectedKey.name || "").then(updatedKey => {
            setKeys(keys.map(k => k.id === updatedKey.id ? updatedKey : k));
            setModalState(null);
        });
        toast.promise(promise, { loading: 'Saving...', success: <b>Name updated!</b>, error: <b>Could not update name.</b> });
    };

    const handleToggleStatus = (key: ApiKey) => {
        const promise = apiKeyService.toggleApiKeyStatus(key.id).then(updatedKey => {
            setKeys(keys.map(k => k.id === updatedKey.id ? updatedKey : k));
        });
        toast.promise(promise, { loading: `${key.is_active ? 'Deactivating' : 'Activating'}...`, success: <b>Status updated!</b>, error: <b>Could not update status.</b> });
    };

    const handleDelete = () => {
        if (!selectedKey) return;
        const promise = apiKeyService.deleteApiKey(selectedKey.id).then(() => {
            setKeys(prev => prev.filter(key => key.id !== selectedKey.id));
            setModalState(null);
        });
        toast.promise(promise, { loading: 'Deleting key...', success: <b>Key deleted.</b>, error: <b>Could not delete key.</b> });
    };

    const copyToClipboard = (keyId: string, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Key copied to clipboard!');
            setCopiedStates(prev => ({ ...prev, [keyId]: true }));
            setTimeout(() => setCopiedStates(prev => ({ ...prev, [keyId]: false })), 2000);
        });
    };

    const closeModal = () => setModalState(null);

    const filteredKeys = useMemo(() =>
            keys.filter(key =>
                (key.name?.toLowerCase().includes(filter.toLowerCase())) ||
                (key.owner?.username.toLowerCase().includes(filter.toLowerCase()))
            ),
        [keys, filter]);

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <header className="mb-8 md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold leading-tight text-gray-900">API Key Management</h1>
                        <p className="mt-2 text-sm text-gray-600">Create and manage API keys for users and services.</p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button onClick={() => setModalState('create')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <Plus size={16}/> Generate New Key
                        </button>
                    </div>
                </header>

                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                        <div className="relative rounded-md shadow-sm w-full max-w-xs">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><Search className="h-5 w-5 text-gray-400" /></div>
                            <input type="text" placeholder="Filter by name or user..." value={filter} onChange={(e) => setFilter(e.target.value)} className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                        </div>
                    </div>

                    <div className="px-4 sm:px-6 py-3 bg-gray-50/75 grid grid-cols-2 md:grid-cols-4 gap-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-2 md:col-span-1">Key Name</div>
                        <div className="hidden md:block">Assigned To</div>
                        <div className="hidden sm:block">Status</div>
                        <div className="text-right">Actions</div>
                    </div>

                    <ul role="list" className="divide-y divide-gray-200">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <SkeletonLoader key={i} />)
                        ) : error ? (
                            <li className="p-8 text-center text-red-500">{error}</li>
                        ) : filteredKeys.length === 0 ? (
                            <li className="text-center p-12">
                                <div className="mx-auto h-12 w-12 text-gray-400"><Search size={48}/></div>
                                <h3 className="mt-2 text-lg font-medium text-gray-900">{filter ? "No keys match filter" : "No API keys found"}</h3>
                            </li>
                        ) : (
                            <AnimatePresence>
                                {filteredKeys.map((key) => (
                                    <motion.li layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key={key.id} className="p-4 sm:px-6 hover:bg-gray-50">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                            <div className="col-span-2 md:col-span-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{key.name || "Untitled Key"}</p>
                                                <p className="text-sm text-gray-500 font-mono truncate">{key.key.substring(0, 8)}••••••••</p>
                                            </div>
                                            <div className="hidden md:flex items-center gap-3 text-sm text-gray-700">
                                                <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">{key.owner ? <User size={16}/> : <Zap size={16}/>}</div>
                                                {key.owner?.username || 'System Key'}
                                            </div>
                                            <div className="hidden sm:block">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${key.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{key.is_active ? 'Active' : 'Deactivated'}</span>
                                            </div>
                                            <div className="flex justify-end">
                                                <Menu as="div" className="relative">
                                                    <Menu.Button className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"><MoreVertical size={20}/></Menu.Button>
                                                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                                                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                                                            <Menu.Item>{({ active }) => (<button onClick={() => copyToClipboard(key.id, key.key)} className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}>{copiedStates[key.id] ? <Check size={16}/> : <Copy size={16}/>} Copy Full Key</button>)}</Menu.Item>
                                                            <Menu.Item>{({ active }) => (<button onClick={() => { setSelectedKey(key); setModalState('edit'); }} className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}><Edit size={16}/> Edit Name</button>)}</Menu.Item>
                                                            <Menu.Item>{({ active }) => (<button onClick={() => handleToggleStatus(key)} className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${key.is_active ? 'text-gray-700' : 'text-green-600'}`}>{key.is_active ? <PowerOff size={16}/> : <Power size={16}/>} {key.is_active ? 'Deactivate' : 'Activate'}</button>)}</Menu.Item>
                                                            <div className="py-1"><hr/></div>
                                                            <Menu.Item>{({ active }) => (<button onClick={() => { setSelectedKey(key); setModalState('confirm-delete'); }} className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600`}><Trash2 size={16}/> Delete...</button>)}</Menu.Item>
                                                        </Menu.Items>
                                                    </Transition>
                                                </Menu>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        )}
                    </ul>
                </div>
            </div>

            <AnimatePresence>
                {modalState === 'create' && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></motion.div>
                        <div className="relative z-50">
                            <Modal title="Generate New Key" icon={<Plus size={20}/>} onClose={closeModal}>
                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div>
                                        <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">Key Name</label>
                                        <input type="text" id="keyName" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g., 'Production Server Key'" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                                    </div>
                                    <div>
                                        <label htmlFor="scope" className="block text-sm font-medium text-gray-700">Permissions (Scope)</label>
                                        <select id="scope" value={selectedScope} onChange={(e) => setSelectedScope(e.target.value as APIScope)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                            <option value={APIScope.ExternalSales}>General Sales Data</option>
                                            <option value={APIScope.AMSalesReport}>AM Sales Report</option>
                                            <option value={APIScope.AMSummaryReport}>AM Summary Report</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="assignUser" className="block text-sm font-medium text-gray-700">Assign to User (Optional)</label>
                                        <select id="assignUser" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                                            <option value="">System Key (Unassigned)</option>
                                            {users.map(user => (<option key={user.id} value={user.id}>{user.username}</option>))}
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Create Key</button>
                                    </div>
                                </form>
                            </Modal>
                        </div>
                    </div>
                )}

                {modalState === 'edit' && selectedKey && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></motion.div>
                        <div className="relative z-50">
                            <Modal title="Edit Key Name" icon={<Edit size={20}/>} onClose={closeModal}>
                                <form onSubmit={handleUpdateName} className="space-y-4">
                                    <div>
                                        <label htmlFor="editKeyName" className="block text-sm font-medium text-gray-700">Key Name</label>
                                        <input type="text" id="editKeyName" value={selectedKey.name || ""} onChange={(e) => setSelectedKey({ ...selectedKey, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">Save Changes</button>
                                    </div>
                                </form>
                            </Modal>
                        </div>
                    </div>
                )}

                {modalState === 'new-key' && selectedKey && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {setModalState(null); setSelectedKey(null);}}></motion.div>
                        <div className="relative z-50">
                            <Modal title="API Key Generated" icon={<KeyRound size={20}/>} onClose={() => {setModalState(null); setSelectedKey(null);}}>
                                <p className="text-sm text-gray-600">Please copy this key. For security, you will not be able to see it again.</p>
                                <div className="mt-4 relative bg-gray-100 p-3 rounded-md flex items-center justify-between border">
                                    <code className="text-gray-800 text-sm break-all font-mono">{selectedKey.key}</code>
                                    <button onClick={() => copyToClipboard('new-key', selectedKey.key)} className="p-2 rounded-md hover:bg-gray-200">
                                        {copiedStates['new-key'] ? <Check size={16} className="text-green-500"/> : <Copy size={16} className="text-gray-500"/>}
                                    </button>
                                </div>
                            </Modal>
                        </div>
                    </div>
                )}

                {modalState === 'confirm-delete' && selectedKey && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></motion.div>
                        <div className="relative z-50">
                            <Modal title="Delete API Key" icon={<AlertTriangle size={20}/>} onClose={closeModal}>
                                <p className="text-sm text-gray-600">Are you sure you want to permanently delete the key named "{selectedKey.name || 'Untitled Key'}"? This action cannot be undone.</p>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">Cancel</button>
                                    <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Delete Key</button>
                                </div>
                            </Modal>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApiKeyManagementPage;