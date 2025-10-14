

import { Service, Professional, StockItem, Client, Appointment } from './types';

export const INITIAL_SERVICES: Service[] = [
  { id: 's1', category: 'Corte', name: 'Corte masculino', description: 'Corte de cabelo', price: 30.00, commissionPercentage: 45, duration: 30 },
  { id: 's2', category: 'Corte', name: 'Corte feminino', description: 'Corte de cabelo', price: 40.00, commissionPercentage: 45, duration: 60 },
  { id: 's3', category: 'Coloração', name: 'Coloração completa', description: 'Coloração', price: 150.00, commissionPercentage: 45, retouchPeriod: 2, dosePrice: 50.00, duration: 120 },
  { id: 's4', category: 'Tratamento', name: 'Manicure simples', description: 'Manicure', price: 25.00, commissionPercentage: 45, duration: 60 },
  { id: 's5', category: 'Tratamento', name: 'Pedicure completa', description: 'Pedicure', price: 35.00, commissionPercentage: 45, duration: 60 },
  { id: 's6', category: 'Coloração', name: 'Mechas', description: 'Técnica de clareamento para cabelos.', price: 250.00, commissionPercentage: 45, retouchPeriod: 6, dosePrice: 80.00, duration: 180 },
];

export const MANAGEMENT_SECTIONS = [
  'Caixa',
  'Agenda de Serviços',
  'Funcionários',
  'Clientes',
  'Estoque',
  'Gestão Financeira',
  'Cálculo de Coloração',
  'Meu Salão',
];

export const PROFESSIONALS: Professional[] = [
  // FIX: Updated commissionOverrides to match the Professional type, changing serviceId to itemId and adding itemType.
  { id: 'p1', name: 'Giovani Macedo', serviceIds: ['s1', 's2', 's3', 's6'], packageTemplateIds: ['pkg_template_1', 'pkg_template_2'], clientBookablePackageIds: ['pkg_template_1'], avatarUrl: `https://i.pravatar.cc/150?u=giovani`, loginId: '001', password: '123', permissions: MANAGEMENT_SECTIONS, employmentType: 'commissioned', cpf: '111.222.333-44', phone: '(11) 98765-4321', email: 'giovani@example.com', commissionOverrides: [{ itemId: 's1', itemType: 'service', percentage: 50 }] },
  { id: 'p2', name: 'Ana Silva', serviceIds: ['s1', 's2', 's4', 's5'], packageTemplateIds: ['pkg_template_2'], clientBookablePackageIds: [], avatarUrl: `https://i.pravatar.cc/150?u=ana`, startTime: '13:00', endTime: '18:00', workingDays: [3, 4, 5, 6], loginId: '002', password: '123', permissions: ['Agenda de Serviços', 'Clientes', 'Estoque'], employmentType: 'commissioned', email: 'ana.silva@example.com' },
  { id: 'p3', name: 'Carlos Souza', serviceIds: ['s3', 's6', 's4', 's5'], avatarUrl: `https://i.pravatar.cc/150?u=carlos`, loginId: '003', password: '123', permissions: ['Agenda de Serviços'], employmentType: 'commissioned' },
  { id: 'p4', name: 'Mariana Silva', serviceIds: ['s1', 's2', 's3', 's6'], packageTemplateIds: ['pkg_template_1'], clientBookablePackageIds: ['pkg_template_1'], avatarUrl: `https://i.pravatar.cc/150?u=mariana`, loginId: '004', password: '123', permissions: ['Agenda de Serviços'], employmentType: 'commissioned' },
  { id: 'p5', name: 'Ana Paula', serviceIds: ['s4', 's5'], avatarUrl: `https://i.pravatar.cc/150?u=anapaula`, startTime: '09:00', endTime: '14:00', workingDays: [1, 2, 3, 4, 5], loginId: '005', password: '123', permissions: ['Agenda de Serviços'], employmentType: 'commissioned' },
];

export const STOCK_ITEMS: StockItem[] = [
  { id: 'st1', category: 'Coloração', name: 'Coloração - Louro Escuro', detail: '60g - Cor: 6.0', quantity: 15, lowStockThreshold: 10, cost: 22.00, brand: 'Wella' },
  { id: 'st2', category: 'Coloração', name: 'Coloração - Louro Médio Acinzentado', detail: '60g - Cor: 7.1', quantity: 8, lowStockThreshold: 10, cost: 22.00, brand: 'Wella' },
  { id: 'st3', category: 'Coloração', name: 'Coloração - Louro Claro Dourado', detail: '60g - Cor: 8.3', quantity: 12, lowStockThreshold: 10, cost: 22.00, brand: 'L\'Oréal' },
  { id: 'st4', category: 'Coloração', name: 'Coloração - Louro Claríssimo', detail: '60g - Cor: 9.0', quantity: 5, lowStockThreshold: 10, cost: 22.00, brand: 'Wella' },
  { id: 'st5', category: 'Coloração', name: 'Coloração - Louro Claríssimo Acinzentado', detail: '60g - Cor: 10.1', quantity: 10, lowStockThreshold: 10, cost: 22.00, brand: 'L\'Oréal' },
  { id: 'st6', category: 'Tonalizante', name: 'Tonalizante - Castanho Claro', detail: '60g - Cor: 5.0', quantity: 20, lowStockThreshold: 15, cost: 18.00, brand: 'Wella' },
  { id: 'st7', category: 'Outros', name: 'Shampoo Hidratante', detail: '1L', quantity: 7, lowStockThreshold: 5, cost: 90.00, brand: 'Kérastase' },
  { id: 'st8', category: 'Revenda', name: 'Shampoo Hidratante (Revenda)', detail: '250ml', quantity: 10, lowStockThreshold: 5, price: 45.00, cost: 25.00, commissionPercentage: 10, brand: 'Kérastase' },
  { id: 'st9', category: 'Revenda', name: 'Condicionador Nutritivo (Revenda)', detail: '250ml', quantity: 8, lowStockThreshold: 5, price: 50.00, cost: 28.00, commissionPercentage: 10, brand: 'Kérastase' },
  { id: 'st10', category: 'Revenda', name: 'Óleo Reparador de Pontas', detail: '50ml', quantity: 15, lowStockThreshold: 3, price: 75.00, cost: 40.00, commissionPercentage: 15, brand: 'Wella' },
  { id: 'st11', category: 'Revenda', name: 'Máscara de Tratamento Intensivo', detail: '200g', quantity: 5, lowStockThreshold: 2, price: 90.00, cost: 50.00, commissionPercentage: 10, brand: 'L\'Oréal' },
  { id: 'st12', category: 'Revenda', name: 'Leave-in Protetor Térmico', detail: '150ml', quantity: 12, lowStockThreshold: 5, price: 60.00, cost: 35.00, commissionPercentage: 10, brand: 'Kérastase' },
];

const today = new Date();
const upcomingBirthday = new Date();
upcomingBirthday.setDate(today.getDate() + 5); // Set birthday to 5 days from now
const upcomingBirthdate = `1990-${String(upcomingBirthday.getMonth() + 1).padStart(2, '0')}-${String(upcomingBirthday.getDate()).padStart(2, '0')}`;

export const CLIENTS: Client[] = [
  { id: 'c1', name: 'Maria Clara', email: 'maria.clara@example.com', phone: '(11) 99999-8888', avatarUrl: 'https://lumiere-a.akamaihd.net/v1/images/p_disneyplus_elsa_19330a6e.png', notes: 'Prefere produtos sem amônia para coloração.', birthdate: upcomingBirthdate },
  { id: 'c2', name: 'João Silva', email: 'joao.silva@example.com', phone: '(11) 98888-7777', avatarUrl: `https://i.pravatar.cc/150?u=joao`, birthdate: '1985-10-25' },
  { id: 'c3', name: 'Beatriz Costa', email: 'beatriz.costa@example.com', phone: '(11) 97777-6666', avatarUrl: `https://i.pravatar.cc/150?u=beatriz`, notes: 'Cliente nova, primeira visita.', birthdate: '1998-03-12' },
  { id: 'c4', name: 'Lucas Martins', email: 'lucas.martins@example.com', phone: '(11) 96666-5555', avatarUrl: `https://i.pravatar.cc/150?u=lucas`, birthdate: '2001-07-01' },
];

export const APPOINTMENTS: Appointment[] = [
    {
        id: 'a1',
        clientId: 'c1',
        service: INITIAL_SERVICES[1], // Corte feminino
        professional: PROFESSIONALS[3], // Mariana Silva
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        time: '15:00 / 15:30',
        status: 'completed',
        paymentStatus: 'paid',
    },
    {
        id: 'a2',
        clientId: 'c1',
        service: INITIAL_SERVICES[3], // Manicure simples
        professional: PROFESSIONALS[4], // Ana Paula
        date: new Date(new Date().setDate(new Date().getDate() - 25)),
        time: '11:00 / 11:30',
        status: 'completed',
        paymentStatus: 'paid',
    },
    {
        id: 'a3',
        clientId: 'c2',
        service: INITIAL_SERVICES[0], // Corte masculino
        professional: PROFESSIONALS[0], // Giovani Macedo
        date: new Date(new Date().setDate(new Date().getDate() - 10)),
        time: '10:00',
        status: 'completed',
        paymentStatus: 'paid',
    },
     {
        id: 'a4',
        clientId: 'c3',
        service: INITIAL_SERVICES[2], // Coloração completa (retouchPeriod: 2 months)
        professional: PROFESSIONALS[2], // Carlos Souza
        date: new Date(new Date().setMonth(new Date().getMonth() - 2)), // 2 months ago
        time: '14:00 / 14:30 / 15:00 / 15:30',
        status: 'completed',
        paymentStatus: 'paid',
    },
    {
        id: 'a5',
        clientId: 'c4',
        service: INITIAL_SERVICES[0], // Corte masculino
        professional: PROFESSIONALS[0], // Giovani Macedo
        date: new Date(new Date().setDate(new Date().getDate() - 5)),
        time: '16:00',
        status: 'completed',
        paymentStatus: 'paid',
    },
    {
        id: 'a6',
        clientId: 'c2',
        service: INITIAL_SERVICES[0], // Corte masculino
        professional: PROFESSIONALS[0], // Giovani Macedo
        date: new Date(new Date().setDate(new Date().getDate() - 35)),
        time: '10:00',
        status: 'completed',
        paymentStatus: 'paid',
    },
    {
        id: 'a7',
        clientId: 'c1',
        service: INITIAL_SERVICES[1], // Corte feminino
        professional: PROFESSIONALS[1], // Ana Silva
        date: new Date(),
        time: '10:00 / 10:30',
        status: 'scheduled',
        paymentStatus: 'pending',
    },
    {
        id: 'a8',
        clientId: 'c3',
        service: INITIAL_SERVICES[2], // Coloração completa
        professional: PROFESSIONALS[2], // Carlos Souza
        date: new Date(),
        time: '11:30 / 12:00 / 12:30 / 13:00',
        status: 'scheduled',
        paymentStatus: 'pending',
    },
    {
        id: 'a9',
        clientId: 'c4',
        service: INITIAL_SERVICES[0], // Corte masculino
        professional: PROFESSIONALS[0], // Giovani Macedo
        date: new Date(),
        time: '14:00',
        status: 'scheduled',
        paymentStatus: 'paid',
    },
    {
        id: 'a10',
        clientId: 'c2',
        service: INITIAL_SERVICES[0], // Corte masculino
        professional: PROFESSIONALS[0], // Giovani Macedo
        date: new Date(new Date().setDate(new Date().getDate() + 1)),
        time: '09:00',
        status: 'scheduled',
        paymentStatus: 'pending',
    }
];