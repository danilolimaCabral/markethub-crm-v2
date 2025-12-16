#!/usr/bin/env python3
"""
Gera gráficos de análise de valor do MarketHub CRM
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# Configurar estilo
plt.style.use('seaborn-v0_8-darkgrid')
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 11
plt.rcParams['font.family'] = 'sans-serif'

# Cores do MarketHub
COLOR_PRIMARY = '#4F46E5'
COLOR_SUCCESS = '#10B981'
COLOR_WARNING = '#F59E0B'
COLOR_DANGER = '#EF4444'
COLOR_INFO = '#3B82F6'

# 1. Gráfico de Comparação de Custos
def generate_cost_comparison():
    fig, ax = plt.subplots(figsize=(14, 8))
    
    categories = ['Desenvolvimento\nCustomizado', 'ERP\nTradicional', 'CRM\nGenérico', 'MarketHub\nCRM']
    costs = [150000, 80000, 30000, 0]  # Custo inicial
    monthly = [5000, 3000, 1500, 297]  # Custo mensal
    
    x = np.arange(len(categories))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, costs, width, label='Custo Inicial (R$)', 
                   color=COLOR_DANGER, alpha=0.8)
    bars2 = ax.bar(x + width/2, monthly, width, label='Custo Mensal (R$)', 
                   color=COLOR_SUCCESS, alpha=0.8)
    
    ax.set_ylabel('Valor (R$)', fontsize=14, fontweight='bold')
    ax.set_title('Comparação de Custos: MarketHub vs Concorrentes', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, fontsize=12)
    ax.legend(fontsize=12, loc='upper left')
    ax.grid(axis='y', alpha=0.3)
    
    # Adicionar valores nas barras
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'R$ {height:,.0f}',
                   ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    # Destacar MarketHub
    ax.patches[6].set_edgecolor(COLOR_PRIMARY)
    ax.patches[6].set_linewidth(3)
    ax.patches[7].set_edgecolor(COLOR_PRIMARY)
    ax.patches[7].set_linewidth(3)
    
    plt.tight_layout()
    plt.savefig('/home/ubuntu/markethub-analysis/comparacao-custos.png', dpi=300, bbox_inches='tight')
    print("✅ Gráfico de comparação de custos gerado!")
    plt.close()

# 2. Gráfico de ROI ao Longo do Tempo
def generate_roi_timeline():
    fig, ax = plt.subplots(figsize=(14, 8))
    
    months = np.arange(0, 25)
    
    # Custos acumulados
    markethub = 297 * months
    erp = 80000 + (3000 * months)
    custom = 150000 + (5000 * months)
    
    ax.plot(months, markethub, label='MarketHub CRM', 
            color=COLOR_SUCCESS, linewidth=3, marker='o', markersize=4)
    ax.plot(months, erp, label='ERP Tradicional', 
            color=COLOR_WARNING, linewidth=2, linestyle='--')
    ax.plot(months, custom, label='Desenvolvimento Customizado', 
            color=COLOR_DANGER, linewidth=2, linestyle=':')
    
    ax.set_xlabel('Meses', fontsize=14, fontweight='bold')
    ax.set_ylabel('Custo Total Acumulado (R$)', fontsize=14, fontweight='bold')
    ax.set_title('ROI: Custo Total Acumulado ao Longo do Tempo', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.legend(fontsize=12, loc='upper left')
    ax.grid(True, alpha=0.3)
    
    # Destacar pontos de break-even
    ax.axvline(x=12, color='gray', linestyle='--', alpha=0.5, linewidth=1)
    ax.text(12, 180000, '12 meses', ha='center', fontsize=10, 
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    # Adicionar anotações
    ax.annotate('Economia de\nR$ 116.436 em 2 anos!', 
                xy=(24, markethub[24]), xytext=(18, 80000),
                arrowprops=dict(arrowstyle='->', color=COLOR_SUCCESS, lw=2),
                fontsize=12, fontweight='bold', color=COLOR_SUCCESS,
                bbox=dict(boxstyle='round', facecolor='white', edgecolor=COLOR_SUCCESS, lw=2))
    
    plt.tight_layout()
    plt.savefig('/home/ubuntu/markethub-analysis/roi-timeline.png', dpi=300, bbox_inches='tight')
    print("✅ Gráfico de ROI gerado!")
    plt.close()

# 3. Gráfico de Funcionalidades
def generate_features_comparison():
    fig, ax = plt.subplots(figsize=(12, 10))
    
    features = [
        'Gestão de Pedidos',
        'Controle Financeiro',
        'Integrações Marketplaces',
        'Calculadora de Taxas',
        'Automação de Estoque',
        'Análise Financeira Avançada',
        'CRM Completo',
        'IA Assistente',
        'Webhooks Tempo Real',
        'Multi-tenant',
        'Segurança 2FA',
        'Relatórios Avançados'
    ]
    
    markethub_scores = [10, 10, 10, 10, 10, 10, 9, 9, 10, 10, 10, 10]
    erp_scores = [8, 9, 5, 0, 0, 6, 7, 0, 5, 3, 8, 7]
    crm_scores = [6, 4, 3, 0, 0, 0, 9, 5, 3, 0, 7, 5]
    
    y = np.arange(len(features))
    height = 0.25
    
    bars1 = ax.barh(y - height, markethub_scores, height, 
                    label='MarketHub CRM', color=COLOR_SUCCESS, alpha=0.9)
    bars2 = ax.barh(y, erp_scores, height, 
                    label='ERP Tradicional', color=COLOR_WARNING, alpha=0.7)
    bars3 = ax.barh(y + height, crm_scores, height, 
                    label='CRM Genérico', color=COLOR_INFO, alpha=0.7)
    
    ax.set_xlabel('Pontuação (0-10)', fontsize=14, fontweight='bold')
    ax.set_title('Comparação de Funcionalidades', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_yticks(y)
    ax.set_yticklabels(features, fontsize=11)
    ax.legend(fontsize=12, loc='lower right')
    ax.set_xlim(0, 11)
    ax.grid(axis='x', alpha=0.3)
    
    # Adicionar valores nas barras
    for bars in [bars1, bars2, bars3]:
        for bar in bars:
            width = bar.get_width()
            if width > 0:
                ax.text(width + 0.2, bar.get_y() + bar.get_height()/2.,
                       f'{width:.0f}',
                       ha='left', va='center', fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('/home/ubuntu/markethub-analysis/comparacao-funcionalidades.png', dpi=300, bbox_inches='tight')
    print("✅ Gráfico de funcionalidades gerado!")
    plt.close()

# 4. Gráfico de Economia de Tempo
def generate_time_savings():
    fig, ax = plt.subplots(figsize=(12, 8))
    
    tasks = [
        'Cálculo de\nTaxas',
        'Sincronização\nde Pedidos',
        'Atualização\nde Estoque',
        'Emissão de\nNotas Fiscais',
        'Relatórios\nFinanceiros',
        'Gestão de\nAnúncios'
    ]
    
    manual_hours = [8, 10, 6, 5, 7, 4]  # Horas por semana manual
    markethub_hours = [0.5, 0.5, 0.5, 1, 1, 0.5]  # Horas com MarketHub
    
    x = np.arange(len(tasks))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, manual_hours, width, 
                   label='Processo Manual', color=COLOR_DANGER, alpha=0.8)
    bars2 = ax.bar(x + width/2, markethub_hours, width, 
                   label='Com MarketHub', color=COLOR_SUCCESS, alpha=0.8)
    
    ax.set_ylabel('Horas por Semana', fontsize=14, fontweight='bold')
    ax.set_title('Economia de Tempo: Manual vs MarketHub', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(tasks, fontsize=11)
    ax.legend(fontsize=12, loc='upper right')
    ax.grid(axis='y', alpha=0.3)
    
    # Adicionar valores nas barras
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.1f}h',
                   ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    # Adicionar texto de economia total
    total_manual = sum(manual_hours)
    total_markethub = sum(markethub_hours)
    savings = total_manual - total_markethub
    
    ax.text(0.5, 0.95, f'Economia Total: {savings:.0f} horas/semana ({savings*4:.0f}h/mês)', 
            transform=ax.transAxes, fontsize=14, fontweight='bold',
            ha='center', va='top', color=COLOR_SUCCESS,
            bbox=dict(boxstyle='round', facecolor='white', edgecolor=COLOR_SUCCESS, lw=2))
    
    plt.tight_layout()
    plt.savefig('/home/ubuntu/markethub-analysis/economia-tempo.png', dpi=300, bbox_inches='tight')
    print("✅ Gráfico de economia de tempo gerado!")
    plt.close()

# 5. Gráfico de Valor de Mercado
def generate_market_value():
    fig, ax = plt.subplots(figsize=(14, 10))
    
    # Componentes de valor
    components = [
        'Desenvolvimento\nInicial',
        'Backend\nCompleto',
        'Frontend\nModerno',
        '76 Módulos\nImplementados',
        'Integrações\n(7 APIs)',
        'Segurança\nEnterprise',
        'Infraestrutura\nCloud',
        'Documentação\nCompleta',
        'Testes e QA',
        'Suporte e\nManutenção'
    ]
    
    values = [80000, 60000, 50000, 120000, 40000, 30000, 20000, 15000, 25000, 40000]
    
    colors = [COLOR_PRIMARY, COLOR_SUCCESS, COLOR_INFO, COLOR_WARNING, 
              COLOR_DANGER, '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1']
    
    # Criar gráfico de pizza
    explode = [0.05 if v > 50000 else 0 for v in values]
    
    wedges, texts, autotexts = ax.pie(values, labels=components, autopct='%1.1f%%',
                                        startangle=90, colors=colors, explode=explode,
                                        textprops={'fontsize': 11, 'fontweight': 'bold'})
    
    # Melhorar aparência dos textos
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontsize(10)
        autotext.set_fontweight('bold')
    
    ax.set_title('Composição do Valor de Mercado do MarketHub CRM\nValor Total Estimado: R$ 480.000', 
                 fontsize=16, fontweight='bold', pad=20)
    
    # Adicionar legenda com valores
    legend_labels = [f'{comp.replace(chr(10), " ")}: R$ {val:,.0f}' 
                     for comp, val in zip(components, values)]
    ax.legend(legend_labels, loc='center left', bbox_to_anchor=(1, 0, 0.5, 1), 
              fontsize=10, frameon=True, fancybox=True, shadow=True)
    
    plt.tight_layout()
    plt.savefig('/home/ubuntu/markethub-analysis/valor-mercado.png', dpi=300, bbox_inches='tight')
    print("✅ Gráfico de valor de mercado gerado!")
    plt.close()

# Executar todas as funções
if __name__ == '__main__':
    print("🎨 Gerando gráficos de análise de valor...\n")
    generate_cost_comparison()
    generate_roi_timeline()
    generate_features_comparison()
    generate_time_savings()
    generate_market_value()
    print("\n✅ Todos os gráficos foram gerados com sucesso!")
    print("📁 Arquivos salvos em: /home/ubuntu/markethub-analysis/")
