import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-blue-300 border-b border-gray-700 pb-2">{title}</h3>
        <div className="space-y-4 text-gray-300 leading-relaxed">
            {children}
        </div>
    </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
     <div className="mt-6">
        <h4 className="text-lg font-semibold mb-2 text-gray-100">{title}</h4>
        <div className="space-y-2 text-sm pl-4 border-l-2 border-gray-700">{children}</div>
    </div>
);

const AppManual: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">Manual do Aplicativo do Salão</h2>
                <p className="text-gray-400">Um guia completo sobre as funcionalidades e como elas se conectam para gerenciar seu negócio de forma eficiente.</p>
            </div>

            <Section title="Visão Geral e Fluxo Principal">
                <p>
                    O aplicativo foi desenhado para integrar todas as operações do salão, desde o agendamento do cliente até o fechamento financeiro. O fluxo principal é:
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                    <li>Um <strong>Agendamento</strong> é criado (pelo cliente ou administrador).</li>
                    <li>O serviço é realizado e a venda é processada no <strong>Caixa</strong>.</li>
                    <li>O <strong>Caixa</strong> registra o pagamento, atualiza o <strong>Estoque</strong> (se um produto foi vendido), e calcula a comissão do <strong>Funcionário</strong>.</li>
                    <li>Todos os dados financeiros (vendas, despesas, comissões, salários) são centralizados na <strong>Gestão Financeira</strong> para análise completa.</li>
                </ol>
            </Section>

            <Section title="Módulos Principais">
                <SubSection title="Dashboard">
                    <p>Sua tela inicial. Mostra um resumo rápido do dia: total de agendamentos, alertas de estoque baixo, aniversários e retoques próximos. Para funcionários, exibe a agenda pessoal do dia.</p>
                </SubSection>
                <SubSection title="Caixa">
                    <p>O coração financeiro do dia a dia. Aqui você abre o caixa com um troco inicial, registra todas as vendas (serviços, produtos, pacotes), aplica descontos, lança vales para funcionários e realiza sangrias (retiradas). Ao final do dia, o fechamento compara o valor esperado com o contado.</p>
                    <p><strong>Funcionários de Aluguel:</strong> Possuem um "Meu Caixa" separado, que funciona de forma independente do caixa principal do salão.</p>
                </SubSection>
                <SubSection title="Agenda de Serviços">
                    <p>Visualização de todos os agendamentos do salão, filtrados por dia e por profissional. Permite criar, editar e apagar agendamentos. Promoções e descontos cadastrados são aplicados automaticamente aqui, mostrando o preço final para o administrador, assim como o cliente vê.</p>
                </SubSection>
                <SubSection title="Funcionários">
                    <p>Gerencie sua equipe. Cadastre novos funcionários, defina permissões de acesso, tipo de contrato (comissionado, salariado, aluguel), horários de trabalho e comissões especiais. Cada funcionário tem um perfil detalhado.</p>
                    <p><strong>Painel Pessoal (Aluguel):</strong> Funcionários com contrato de aluguel têm acesso a um painel de gestão pessoal, onde controlam seus próprios serviços, pacotes, estoque, despesas e finanças de forma isolada do salão.</p>
                </SubSection>
                 <SubSection title="Clientes">
                    <p>Sua base de clientes. Veja a lista completa, busque por um cliente específico e acesse seu perfil detalhado. O perfil do cliente centraliza informações de contato, histórico de serviços, pacotes ativos e anotações importantes (como fórmulas de coloração).</p>
                </SubSection>
                 <SubSection title="Estoque">
                    <p>Controle total dos seus produtos. Separe itens de uso interno e de revenda. O sistema alerta quando um produto atinge o "estoque baixo". A venda de um produto de revenda no Caixa automaticamente deduz a quantidade do estoque.</p>
                </SubSection>
                 <SubSection title="Gestão Financeira">
                    <p>A central de inteligência do seu negócio. Aqui você encontra relatórios detalhados:</p>
                    <ul className="list-disc list-inside pl-4">
                        <li><strong>Dashboard de Gestão:</strong> Visão consolidada do ciclo de pagamento atual, com lucro líquido, custos e desempenho da equipe.</li>
                        <li><strong>Ciclos de Pagamento:</strong> Configure como e quando os pagamentos são feitos (quinzenal, mensal etc.) e veja o histórico dos ciclos passados.</li>
                        <li><strong>Desempenho Diário:</strong> Análise detalhada de um dia específico, incluindo fechamentos de caixa e rendimento por funcionário.</li>
                        <li><strong>Gestão de Vales:</strong> Acompanhe e quite os vales e adiantamentos dos funcionários.</li>
                        <li><strong>Despesas do Salão:</strong> Registre todos os custos fixos e variáveis (aluguel, água, luz, compra de produtos) para um cálculo de lucro preciso.</li>
                    </ul>
                </SubSection>
                 <SubSection title="Meu Salão">
                    <p>Personalize o aplicativo. Altere o nome do salão, a foto de capa, dias e horários de funcionamento, e configure a senha de privacidade para proteger informações sensíveis de clientes.</p>
                </SubSection>
            </Section>

             <Section title="Conexões Importantes">
                <p>Entender como as partes se conectam é a chave para usar o app ao máximo:</p>
                <ul className="list-disc list-inside space-y-3 pl-4">
                    <li><strong>Serviços + Descontos:</strong> Ao cadastrar uma promoção em "Cadastros Gerais", o preço do serviço aparecerá com desconto na <strong>Agenda</strong> e na tela de agendamento do cliente no dia correto da semana.</li>
                    <li><strong>Venda no Caixa → Tudo:</strong> Uma venda finalizada no <strong>Caixa</strong> pode:
                        <ul className="list-['-_'] list-inside pl-6 mt-1">
                            <li>Marcar um <strong>Agendamento</strong> como "concluído".</li>
                            <li>Dar baixa em um item de <strong>Estoque</strong>.</li>
                            <li>Gerar comissão que aparecerá nos relatórios de <strong>Gestão Financeira</strong> e no perfil do <strong>Funcionário</strong>.</li>
                            <li>Utilizar um crédito de um <strong>Pacote</strong> do <strong>Cliente</strong>.</li>
                        </ul>
                    </li>
                     <li><strong>Funcionário (Salariado) → Gestão Financeira:</strong> O salário fixo cadastrado para um funcionário é automaticamente calculado como um custo na <strong>Gestão Financeira</strong> durante o ciclo de pagamento correspondente.</li>
                     <li><strong>Compra de Estoque → Despesas:</strong> Ao adicionar um novo item ao <strong>Estoque</strong> com um custo definido, uma despesa é automaticamente registrada na seção <strong>Despesas do Salão</strong>, garantindo que o custo dos produtos seja contabilizado no lucro líquido.</li>
                </ul>
            </Section>
        </div>
    );
};

export default AppManual;