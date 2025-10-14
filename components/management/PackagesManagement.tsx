
import React, { useState, useMemo } from 'react';
import { usePackages } from '../../contexts/PackagesContext';
import { useServices } from '../../contexts/ServicesContext';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { ServicePackageTemplate } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import AdminAddPackageModal from '../AdminAddPackageModal';
import DeletePackageConfirmationModal from '../DeletePackageConfirmationModal';

const PackagesManagement: React.FC = () => {
    const { packageTemplates, addPackageTemplate, updatePackageTemplate, deletePackageTemplate } = usePackages();
    const { services } = useServices();
    const { removeCommissionOverridesForItem } = useProfessionals();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<ServicePackageTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<ServicePackageTemplate | null>(null);

    const getServiceName = (serviceId: string) => {
        return services.find(s => s.id === serviceId)?.name || 'Serviço desconhecido';
    };

    const handleOpenAddModal = () => {
        setTemplateToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (template: ServicePackageTemplate) => {
        setTemplateToEdit(template);
        setIsModalOpen(true);
    };

    const handleSave = (templateData: Omit<ServicePackageTemplate, 'id'> | ServicePackageTemplate) => {
        if ('id' in templateData) {
            updatePackageTemplate(templateData);
        } else {
            addPackageTemplate(templateData);
        }
        setIsModalOpen(false);
    };

    const handleOpenDeleteModal = (template: ServicePackageTemplate) => {
        setTemplateToDelete(template);
    };
    
    const handleConfirmDelete = () => {
        if (templateToDelete) {
            removeCommissionOverridesForItem(templateToDelete.id);
            deletePackageTemplate(templateToDelete.id);
        }
        setTemplateToDelete(null);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Gerenciamento de Pacotes de Serviços</h2>
                        <p className="text-gray-400">Crie, edite e remova os pacotes de serviços oferecidos.</p>
                    </div>
                    <button onClick={handleOpenAddModal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        <span>Criar Novo Pacote</span>
                    </button>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {packageTemplates.length > 0 ? (
                            packageTemplates.map(template => (
                                <div key={template.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-lg">{template.name}</p>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                            <span>Serviço: <span className="font-medium text-gray-300">{getServiceName(template.serviceId)}</span></span>
                                            <span>Preço: <span className="font-medium text-green-400">R$ {template.price.toFixed(2).replace('.', ',')}</span></span>
                                            <span>Sessões: <span className="font-medium text-gray-300">{template.sessionCount}</span></span>
                                            <span>Validade: <span className="font-medium text-gray-300">{template.validityDays} dias</span></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <button onClick={() => handleOpenEditModal(template)} className="p-2 text-gray-400 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleOpenDeleteModal(template)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-12">Nenhum pacote de serviço cadastrado.</p>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AdminAddPackageModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    services={services}
                    templateToEdit={templateToEdit}
                />
            )}

            {templateToDelete && (
                <DeletePackageConfirmationModal
                    isOpen={!!templateToDelete}
                    onClose={() => setTemplateToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    packageName={templateToDelete.name}
                />
            )}
        </>
    );
};

export default PackagesManagement;