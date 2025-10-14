import React from 'react';
import PackagesManagement from './PackagesManagement';
import ServicesManagement from './ServicesManagement';
import RolesManagement from './RolesManagement';
import DefaultCommissionManagement from './DefaultCommissionManagement';
import CommissionOverrides from './CommissionOverrides';
import DiscountsManagement from './DiscountsManagement';

const GeneralRegistrations: React.FC = () => {
    return (
        <div className="space-y-12">
            <ServicesManagement />
            <CommissionOverrides />
            <DiscountsManagement />
            <PackagesManagement />
            <RolesManagement />
            <DefaultCommissionManagement />
        </div>
    );
};

export default GeneralRegistrations;