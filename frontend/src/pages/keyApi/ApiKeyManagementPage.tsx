import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { ApiKey } from '../../types/apiKey';
import * as apiKeyService from '../../services/apiKeyService';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Transition } from '@headlessui/react';
import { KeyRound, Copy, Check, AlertTriangle, Plus, Trash2, Edit, Power, PowerOff, MoreVertical, Server, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// --- Modal Component (Unchanged) ---
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

// --- Skeleton Loader for List (Unchanged) ---
const SkeletonLoader: React.FC = () => (
    <li className="px-4 py-4 sm:px-6 animate-pulse">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                </div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
    </li>
);

const ApiKeyManagementPage: React.FC = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [filteredKeys, setFilteredKeys] = useState<ApiKey[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalState, setModalState] = useState<'create' | 'edit' | 'new-key' | 'confirm-delete' | 'view-key' | null>(null);
    const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
    const [keyName, setKeyName] = useState('');
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    // --- All functions (fetch, create, update, etc.) remain unchanged ---
    const fetchKeys = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedKeys = await apiKeyService.getApiKeys();
            setKeys(fetchedKeys);
            setFilteredKeys(fetchedKeys);
            toast.success('API keys loaded successfully!', { icon: <Check className="text-green-500" />, duration: 2000 });
        } catch (err) {
            setError('Failed to fetch API keys.');
            toast.error('Failed to fetch API keys.', { icon: <AlertTriangle className="text-red-500" />, duration: 3000 });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const filtered = keys.filter((key) =>
            (key.name || 'Untitled Key').toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredKeys(filtered);
    }, [searchQuery, keys]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const promise = apiKeyService.createApiKey(keyName, 'external_sales').then((newKey) => {
            setKeys((prev) => [newKey, ...prev]);
            setSelectedKey(newKey);
            setModalState('new-key');
            setKeyName('');
        });
        toast.promise(promise, {
            loading: 'Creating API key...',
            success: <b>API key "{keyName || 'Untitled Key'}" created!</b>,
            error: <b>Failed to create API key.</b>,
        }, { success: { icon: <Check className="text-green-500" />, duration: 2000 }, error: { icon: <AlertTriangle className="text-red-500" />, duration: 3000 } });
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKey) return;
        const promise = apiKeyService.updateApiKeyName(selectedKey.id, selectedKey.name || '').then((updatedKey) => {
            setKeys(keys.map((k) => (k.id === updatedKey.id ? updatedKey : k)));
            setModalState(null);
        });
        toast.promise(promise, {
            loading: 'Updating key name...',
            success: <b>Key name updated to "{selectedKey.name || 'Untitled Key'}"!</b>,
            error: <b>Failed to update key name.</b>,
        }, { success: { icon: <Check className="text-green-500" />, duration: 2000 }, error: { icon: <AlertTriangle className="text-red-500" />, duration: 3000 } });
    };

    const handleToggleStatus = (key: ApiKey) => {
        const promise = apiKeyService.toggleApiKeyStatus(key.id).then((updatedKey) => {
            setKeys(keys.map((k) => (k.id === updatedKey.id ? updatedKey : k)));
        });
        toast.promise(promise, {
            loading: `${key.is_active ? 'Deactivating' : 'Activating'} key "${key.name || 'Untitled Key'}"...`,
            success: <b>Key "${key.name || 'Untitled Key'}" ${key.is_active ? 'deactivated' : 'activated'}!</b>,
            error: <b>Failed to ${key.is_active ? 'deactivate' : 'activate'} key.</b>,
        }, { success: { icon: <Check className="text-green-500" />, duration: 2000 }, error: { icon: <AlertTriangle className="text-red-500" />, duration: 3000 } });
    };

    const handleDelete = () => {
        if (!selectedKey) return;
        const keyName = selectedKey.name || 'Untitled Key';
        const promise = apiKeyService.deleteApiKey(selectedKey.id).then(() => {
            setKeys((prev) => prev.filter((key) => key.id !== selectedKey.id));
            setModalState(null);
        });
        toast.promise(promise, {
            loading: `Deleting key "${keyName}"...`,
            success: <b>Key "${keyName}" permanently deleted.</b>,
            error: <b>Failed to delete key "${keyName}".</b>,
        }, { success: { icon: <Check className="text-green-500" />, duration: 2000 }, error: { icon: <AlertTriangle className="text-red-500" />, duration: 3000 } });
    };

    const copyToClipboard = (keyId: string, text: string) => {
        const key = keys.find((k) => k.id === keyId);
        const keyName = key ? key.name || 'Untitled Key' : 'API Key';
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`Key "${keyName}" copied to clipboard!`, { icon: <Check className="text-green-500" />, duration: 2000 });
            setCopiedStates((prev) => ({ ...prev, [keyId]: true }));
            setTimeout(() => setCopiedStates((prev) => ({ ...prev, [keyId]: false })), 2000);
        }).catch(() => {
            toast.error(`Failed to copy key "${keyName}".`, { icon: <AlertTriangle className="text-red-500" />, duration: 3000 });
        });
    };

    const closeModal = () => setModalState(null);

    const handleViewKey = (key: ApiKey) => {
        setSelectedKey(key);
        setModalState('view-key');
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* --- Header and Search (Unchanged) --- */}
                <header className="mb-8 md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">API Key Management</h1>
                        <p className="mt-1 text-sm text-gray-500">Create and manage API keys for external services.</p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <button
                            onClick={() => setModalState('create')}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Plus size={16} /> Generate New Key
                        </button>
                    </div>
                </header>

                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by key name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={20} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* --- List Section --- */}
                <div className="bg-white shadow rounded-lg">
                    <ul role="list" className="divide-y divide-gray-200">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <SkeletonLoader key={i} />)
                        ) : error ? (
                            <li className="p-8 text-center text-red-500 flex items-center justify-center gap-3">
                                <AlertTriangle /> {error}
                            </li>
                        ) : filteredKeys.length === 0 ? (
                            <li className="text-center p-12">
                                <div className="mx-auto h-12 w-12 text-gray-400">
                                    <Server size={48} />
                                </div>
                                <h3 className="mt-2 text-lg font-medium text-gray-900">No API keys found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchQuery ? 'No keys match your search.' : 'Get started by generating your first API key.'}
                                </p>
                            </li>
                        ) : (
                            <AnimatePresence initial={false}>
                                {filteredKeys.map((key) => (
                                    <motion.li
                                        layout="position"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={key.id}
                                        className="px-4 py-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <motion.div
                                                animate={{ opacity: key.is_active ? 1 : 0.4 }}
                                                className={`p-2 rounded-full ${key.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                                            >
                                                <KeyRound size={16} />
                                            </motion.div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{key.name || 'Untitled Key'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            {/* ✨✨ --- START OF CHANGE --- ✨✨ */}
                                            <div className="flex items-center gap-2">
                                                {key.is_active && (
                                                    <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                                                )}
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        key.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                                            </div>
                                            {/* ✨✨ --- END OF CHANGE --- ✨✨ */}
                                            <p className="hidden md:block text-sm text-gray-500">{formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}</p>
                                            <Menu as="div" className="relative inline-block text-left">
                                                <Menu.Button className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500">
                                                    <MoreVertical size={18} />
                                                </Menu.Button>
                                                <Transition
                                                    as={Fragment}
                                                    enter="transition ease-out duration-100"
                                                    enterFrom="transform opacity-0 scale-95"
                                                    enterTo="transform opacity-100 scale-100"
                                                    leave="transition ease-in duration-75"
                                                    leaveFrom="transform opacity-100 scale-100"
                                                    leaveTo="transform opacity-0 scale-95"
                                                >
                                                    {/* --- Dropdown Menu (Unchanged) --- */}
                                                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                                        <Menu.Item>
                                                            <p className="px-4 pt-2 pb-1 text-xs text-gray-400 font-mono">
                                                                {key.key.substring(0, 8)}••••••••
                                                            </p>
                                                        </Menu.Item>
                                                        <div className="py-1">
                                                            <hr />
                                                        </div>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleViewKey(key)}
                                                                    className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}
                                                                >
                                                                    <Copy size={16} />
                                                                    Copy Full Key
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedKey(key);
                                                                        setModalState('edit');
                                                                    }}
                                                                    className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700`}
                                                                >
                                                                    <Edit size={16} />
                                                                    Edit Name
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => handleToggleStatus(key)}
                                                                    className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${
                                                                        key.is_active ? 'text-gray-700' : 'text-green-600'
                                                                    }`}
                                                                >
                                                                    {key.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                                                                    {key.is_active ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                        <div className="py-1">
                                                            <hr />
                                                        </div>
                                                        <Menu.Item>
                                                            {({ active }) => (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedKey(key);
                                                                        setModalState('confirm-delete');
                                                                    }}
                                                                    className={`${active && 'bg-gray-100'} w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                    Delete...
                                                                </button>
                                                            )}
                                                        </Menu.Item>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        </div>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        )}
                    </ul>
                </div>
            </div>

            {/* --- Modals (Unchanged) --- */}
            <AnimatePresence>
                {modalState === 'create' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        ></motion.div>
                        <Modal title="Generate New Key" icon={<Plus size={20} />} onClose={closeModal}>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Key Name
                                    </label>
                                    <input
                                        type="text"
                                        id="keyName"
                                        value={keyName}
                                        onChange={(e) => setKeyName(e.target.value)}
                                        placeholder="e.g., 'Production Server Key'"
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Create Key
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    </div>
                )}

                {modalState === 'edit' && selectedKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        ></motion.div>
                        <Modal title="Edit Key Name" icon={<Edit size={20} />} onClose={closeModal}>
                            <form onSubmit={handleUpdateName} className="space-y-4">
                                <div>
                                    <label htmlFor="editKeyName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Key Name
                                    </label>
                                    <input
                                        type="text"
                                        id="editKeyName"
                                        value={selectedKey.name || ''}
                                        onChange={(e) => setSelectedKey({ ...selectedKey, name: e.target.value })}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </Modal>
                    </div>
                )}

                {modalState === 'new-key' && selectedKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        ></motion.div>
                        <Modal title="API Key Generated" icon={<KeyRound size={20} />} onClose={closeModal}>
                            <p className="text-sm text-gray-600">Please copy this key. For security, you will not be able to see it again.</p>
                            <div className="mt-4 relative bg-gray-100 p-3 rounded-md flex items-center justify-between border">
                                <code className="text-gray-800 text-sm break-all font-mono">{selectedKey.key}</code>
                                <button
                                    onClick={() => copyToClipboard('new-key', selectedKey.key)}
                                    className="p-2 rounded-md hover:bg-gray-200"
                                >
                                    {copiedStates['new-key'] ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
                                </button>
                            </div>
                        </Modal>
                    </div>
                )}

                {modalState === 'view-key' && selectedKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        ></motion.div>
                        <Modal title="Copy API Key" icon={<Copy size={20} />} onClose={closeModal}>
                            <p className="text-sm text-gray-600">Please copy this key. For security, you will not be able to see it again after closing.</p>
                            <div className="mt-4 relative bg-gray-100 p-3 rounded-md flex items-center justify-between border">
                                <code className="text-gray-800 text-sm break-all font-mono">{selectedKey.key}</code>
                                <button
                                    onClick={() => copyToClipboard(selectedKey.id, selectedKey.key)}
                                    className="p-2 rounded-md hover:bg-gray-200"
                                >
                                    {copiedStates[selectedKey.id] ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
                                </button>
                            </div>
                        </Modal>
                    </div>
                )}

                {modalState === 'confirm-delete' && selectedKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={closeModal}
                        ></motion.div>
                        <Modal title="Delete API Key" icon={<AlertTriangle size={20} />} onClose={closeModal}>
                            <p className="text-sm text-gray-600">
                                Are you sure you want to permanently delete the key named "{selectedKey.name || 'Untitled Key'}"? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    Delete Key
                                </button>
                            </div>
                        </Modal>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApiKeyManagementPage;