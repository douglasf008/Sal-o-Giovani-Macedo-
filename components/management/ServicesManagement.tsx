
import React, { useState } from 'react';
import { useServices } from '../../contexts/ServicesContext';
import { useAppointments } from '../../contexts/AppointmentsContext';
import { useProfessionals } from '../../contexts/ProfessionalsContext';
import { Service } from '../../types';
import AdminAddServiceModal from '../AdminAddServiceModal';
import DeleteServiceConfirmationModal from '../DeleteServiceConfirmationModal';
import PlusIcon from '../icons/PlusIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import { useSalonSettings } from '../../salonSettings';

const ServicesManagement: React.FC = () => {
    const { services, deleteService, getServiceCategories } = useServices();
    const { appointments, deleteAppointmentsByServiceId } = useAppointments();
    const { removeCommissionOverridesForItem } = useProfessionals();
    const { settings } = useSalonSettings();
    
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

    const handleOpenServiceModal = (service: Service | null) => {
        setServiceToEdit(service);
        setIsServiceModalOpen(true);
    };

    const handleDeleteServiceClick = (service: Service) => {
        setServiceToDelete(service);
    };

    const confirmDeleteService = () => {
        if (!serviceToDelete) return;

        deleteAppointmentsByServiceId(serviceToDelete.id);
        removeCommissionOverridesForItem(serviceToDelete.id);
        deleteService(serviceToDelete.id);

        setServiceToDelete(null);
    };

    const dependentAppointmentsCount = serviceToDelete ? appointments.filter(a => a.service.id === serviceToDelete.id).length : 0;

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Gerenciamento de Serviços</h2>
                        <p className="text-gray-400">Crie, edite e remova os serviços oferecidos no salão.</p>
                    </div>
                    <button onClick={() => handleOpenServiceModal(null)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-500 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        <span>Adicionar Serviço</span>
                    </button>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {services.length > 0 ? services.map(service => (
                            <div key={service.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{service.name}</p>
                                    <p className="text-sm text-gray-400">
                                        R$ {service.price.toFixed(2).replace('.', ',')} | Comissão: {service.commissionPercentage ?? settings.defaultCommissionPercentage}%
                                        {service.duration && ` | Duração: ${service.duration} min`}
                                        {service.retouchPeriod && ` | Retoque: ${service.retouchPeriod} meses`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleOpenServiceModal(service)} className="p-2 text-gray-300 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteServiceClick(service)} className="p-2 text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        )) : <p className="text-center text-gray-500 py-4">Nenhum serviço cadastrado.</p>}
                    </div>
                </div>
            </div>

            {serviceToDelete && (
                <DeleteServiceConfirmationModal
                    isOpen={!!serviceToDelete}
                    onClose={() => setServiceToDelete(null)}
                    onConfirm={confirmDeleteService}
                    serviceName={serviceToDelete.name}
                    dependentAppointmentsCount={dependentAppointmentsCount}
                />
            )}

            {isServiceModalOpen && (
                <AdminAddServiceModal
                    onClose={() => setIsServiceModalOpen(false)}
                    serviceToEdit={serviceToEdit}
                    allCategories={getServiceCategories()}
                    defaultCommission={settings.defaultCommissionPercentage}
                />
            )}
        </>
    );
};

export default ServicesManagement;